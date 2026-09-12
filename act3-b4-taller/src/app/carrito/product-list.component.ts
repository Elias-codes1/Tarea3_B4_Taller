import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from './cart.service';
import { Product } from './product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  productos: Product[] = [
    { id: 1, nombre: 'Teclado mecánico', precio: 250 },
    { id: 2, nombre: 'Mouse inalámbrico', precio: 120 },
    { id: 3, nombre: 'Monitor 24"', precio: 950 }
  ];

  constructor(private cartService: CartService) {}

  agregarAlCarrito(producto: Product): void {
    this.cartService.agregarProducto(producto);
  }
}