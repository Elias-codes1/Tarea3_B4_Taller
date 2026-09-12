import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  // Observable público al que los componentes se suscriben
  cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  // Observable derivado: total general del carrito
  total$: Observable<number> = this.cart$.pipe(
    map(items => items.reduce((acc, item) => acc + item.product.precio * item.cantidad, 0))
  );

  agregarProducto(product: Product): void {
    const items = this.cartSubject.value;
    const existente = items.find(i => i.product.id === product.id);

    if (existente) {
      existente.cantidad += 1;
      this.cartSubject.next([...items]);
    } else {
      this.cartSubject.next([...items, { product, cantidad: 1 }]);
    }
  }

  actualizarCantidad(productId: number, cantidad: number): void {
    const items = this.cartSubject.value.map(item =>
      item.product.id === productId ? { ...item, cantidad } : item
    );
    this.cartSubject.next(items);
  }

  eliminarProducto(productId: number): void {
    const items = this.cartSubject.value.filter(i => i.product.id !== productId);
    this.cartSubject.next(items);
  }
}
