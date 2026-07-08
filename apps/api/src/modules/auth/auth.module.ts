import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { RbacModule } from "../rbac/rbac.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    RbacModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET ?? "dev-secret",
      signOptions: { expiresIn: (process.env.ACCESS_TOKEN_TTL ?? "15m") as `${number}${"s" | "m" | "h" | "d"}` },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
