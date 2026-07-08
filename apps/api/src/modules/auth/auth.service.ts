import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "crypto";
import { AuthProviderType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PermissionsService } from "../rbac/permissions.service";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private permissionsService: PermissionsService,
  ) {}

  async validateCredentials(email: string, password: string) {
    const identity = await this.prisma.authIdentity.findFirst({
      where: { provider: AuthProviderType.LOCAL, user: { email } },
      include: { user: true },
    });
    if (!identity || !identity.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const valid = await argon2.verify(identity.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (identity.user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }
    return identity.user;
  }

  async login(email: string, password: string, meta: RequestMeta): Promise<{
    user: { id: string; email: string; firstName: string; lastName: string };
    tokens: TokenPair;
  }> {
    const user = await this.validateCredentials(email, password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    const tokens = await this.issueTokenPair(user.id, meta);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens,
    };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (existing.revokedAt) {
      // Reuse of a revoked token: possible theft. Revoke the whole family for this user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException("Refresh token reuse detected, session revoked");
    }
    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    const newTokens = await this.issueTokenPair(existing.userId, meta);
    const newRefreshHash = hashToken(newTokens.refreshToken);
    const newRow = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: newRefreshHash },
    });
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedByTokenId: newRow?.id },
    });

    return newTokens;
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException();
    const permissions = await this.permissionsService.getEffectivePermissions(userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      roles: user.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name })),
      permissions,
    };
  }

  private async issueTokenPair(userId: string, meta: RequestMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const permissions = await this.permissionsService.getEffectivePermissions(userId);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions,
    });

    const rawRefreshToken = randomBytes(32).toString("hex");
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
  }
}
