import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from './cart.service';
import { SubtotalPipe } from './subtotal.pipe';

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [CommonModule, SubtotalPipe],
  templateUrl: './cart-summary.component.html'
})
export class CartSummaryComponent {
  private cartService = inject(CartService);

  cart$ = this.cartService.cart$;
  total$ = this.cartService.total$;

  actualizarCantidad(productId: number, cantidad: string): void {
    this.cartService.actualizarCantidad(productId, Number(cantidad));
  }

  eliminarProducto(productId: number): void {
    this.cartService.eliminarProducto(productId);
  }
}