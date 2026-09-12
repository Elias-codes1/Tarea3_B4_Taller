import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductListComponent } from './carrito/product-list.component';
import { CartSummaryComponent } from './carrito/cart-summary.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ProductListComponent, CartSummaryComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('act3-b4-taller');
}