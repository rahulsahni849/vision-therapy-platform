import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }
    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      return null;
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = await argon2.hash(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new tokens
    const user = storedToken.user;
    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
    });

    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = await argon2.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  async inviteUser(orgId: string, email: string, firstName: string, lastName: string, role: 'PRACTITIONER' | 'PATIENT') {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setHours(inviteExpires.getHours() + 24); // 24 hours to accept

    const user = await this.prisma.user.create({
      data: {
        organizationId: orgId,
        email,
        firstName,
        lastName,
        role,
        passwordHash: '', // Will be set when user accepts invite
        inviteToken,
        inviteExpires,
        isActive: false,
      },
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;

    // Send invite email
    await this.emailService.sendInviteEmail(email, inviteLink);

    return {
      id: user.id,
      email: user.email,
      inviteLink,
    };
  }

  async setPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteExpires: { gt: new Date() },
        isActive: false,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const passwordHash = await argon2.hash(password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        inviteToken: null,
        inviteExpires: null,
        isActive: true,
      },
    });

    return { message: 'Password set successfully' };
  }

  private async generateRefreshToken(userId: string) {
    const token = randomBytes(40).toString('hex');
    const tokenHash = await argon2.hash(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(this.configService.get('REFRESH_TOKEN_EXPIRATION_DAYS', '30')));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token };
  }

  async getUserFromToken(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });
  }
}
