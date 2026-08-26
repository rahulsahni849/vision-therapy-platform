import { Controller, Post, Body, Res, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, SetPasswordDto, InviteUserDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const result = await this.authService.login(user);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS || '30') * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    if (!refreshTokenDto.refreshToken) {
      return { message: 'Refresh token required' };
    }
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Body() body: { refreshToken?: string }) {
    if (body.refreshToken) {
      await this.authService.logout(body.refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async inviteUser(@Request() req: any, @Body() inviteDto: InviteUserDto) {
    return this.authService.inviteUser(
      req.user.orgId,
      inviteDto.email,
      inviteDto.firstName,
      inviteDto.lastName,
      inviteDto.role,
    );
  }

  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  async setPassword(@Body() setPasswordDto: SetPasswordDto) {
    return this.authService.setPassword(setPasswordDto.token, setPasswordDto.password);
  }
}
