import { Module } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { AdminGuard } from './admin.guard';
import { RestaurantOwnerGuard } from './restaurant-owner.guard';

@Module({
  providers: [JwtGuard, AdminGuard, RestaurantOwnerGuard],
  exports: [JwtGuard, AdminGuard, RestaurantOwnerGuard],
})
export class AuthModule {}
