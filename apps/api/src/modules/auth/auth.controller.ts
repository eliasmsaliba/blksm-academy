import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/types/request-user";
import { AuthService, TokenPair } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

const isProd = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
// Without a shared parent COOKIE_DOMAIN, the deployed frontend and API sit on
// different registrable domains (e.g. Netlify + Railway) and the request is
// truly cross-site, which requires SameSite=None (and therefore Secure).
// In dev, or once a shared parent domain is configured, Lax is safer and sufficient.
const CROSS_SITE = isProd && !COOKIE_DOMAIN;
const COOKIE_SAMESITE: "none" | "lax" = CROSS_SITE ? "none" : "lax";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto.email, dto.password, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) throw new UnauthorizedException("No refresh token");

    const tokens = await this.authService.refresh(rawRefreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setAuthCookies(res, tokens);
    return { success: true };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }
    res.clearCookie("access_token", {
      path: "/",
      domain: COOKIE_DOMAIN,
      secure: isProd,
      sameSite: COOKIE_SAMESITE,
    });
    res.clearCookie("refresh_token", {
      path: "/api/auth",
      domain: COOKIE_DOMAIN,
      secure: isProd,
      sameSite: COOKIE_SAMESITE,
    });
    return { success: true };
  }

  @Get("me")
  async me(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.id);
  }

  private setAuthCookies(res: Response, tokens: TokenPair) {
    res.cookie("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: COOKIE_SAMESITE,
      domain: COOKIE_DOMAIN,
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: COOKIE_SAMESITE,
      domain: COOKIE_DOMAIN,
      path: "/api/auth",
      expires: tokens.refreshTokenExpiresAt,
    });
  }
}
