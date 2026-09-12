# Documentación Técnica

## Taller: Carrito de Ventas con Observables y Pipes en Angular

**Proyecto:** act3-b4-taller

\---

## 1\. Contexto y alcance

Esta actividad implementa un carrito de compras simple para una tienda de
periféricos de computadora. El catálogo fijo incluye tres productos
(Teclado mecánico, Mouse inalámbrico, Monitor 24"), y el usuario puede
agregarlos al carrito, modificar la cantidad de cada uno y eliminarlos,
viendo en todo momento el subtotal por producto y el total general
actualizados de forma reactiva.

El proyecto se generó con Angular CLI usando componentes **standalone**
(sin NgModules), por lo que la comunicación entre componentes se resuelve
importando directamente el componente que se necesita, en lugar de
declararlo en un módulo.

2\. Estructura de archivos
src/app/carrito/
├── product.model.ts              -> interfaces Product y CartItem
├── cart.service.ts                -> estado del carrito (BehaviorSubject)
├── subtotal.pipe.ts               -> pipe personalizado
├── product-list.component.ts/html -> catálogo de productos
└── cart-summary.component.ts/html -> resumen del carrito


## 3\. Modelo de datos

typescript
export interface Product {
  id: number;
  nombre: string;
  precio: number;
}

export interface CartItem {
  product: Product;
  cantidad: number;
}


Se separó `Product` (datos fijos del catálogo) de `CartItem` (un producto
más la cantidad que el usuario decidió llevar), porque son dos conceptos
distintos: el precio de un producto no cambia, pero la cantidad en el
carrito sí. Esto evita mutar el catálogo original y mantiene el carrito
como una capa independiente sobre los datos del producto.





## 4\. CartService: fuente única de verdad

El servicio expone el estado del carrito mediante un `BehaviorSubject`
privado, y lo publica como un `Observable` de solo lectura (`cart$`), para
que ningún componente pueda modificar el estado directamente sin pasar por
los métodos del servicio (`agregarProducto`, `actualizarCantidad`,
`eliminarProducto`).

typescript
private cartSubject = new BehaviorSubject<CartItem\[]>(\[]);
cart$: Observable<CartItem\[]> = this.cartSubject.asObservable();

total$: Observable<number> = this.cart$.pipe(
  map(items => items.reduce((acc, item) => acc + item.product.precio \* item.cantidad, 0))
);


**Por qué `BehaviorSubject` y no un `Subject` normal:** un `BehaviorSubject`
guarda el último valor emitido y lo entrega de inmediato a cualquier
componente que se suscriba después (por ejemplo, si `CartSummaryComponent`
se renderizara más tarde que `ProductListComponent`, igual recibiría el
estado actual del carrito, no un carrito vacío hasta el próximo cambio).

**`total$` como Observable derivado:** en lugar de recalcular el total
dentro del componente cada vez que cambia el carrito, el total se calcula
una sola vez en el servicio con el operador `map`, y cualquier componente
que lo necesite simplemente se suscribe a `total$`. Esto evita duplicar la
lógica de cálculo si en el futuro se agrega, por ejemplo, un componente de
factura o de checkout.

**Lógica de `agregarProducto`:** si el producto ya existe en el carrito,
incrementa su cantidad en vez de crear una fila duplicada; si no existe,
lo agrega como un nuevo `CartItem` con cantidad 1.





## 5\. Pipe personalizado: subtotal

```typescript
@Pipe({ name: 'subtotal', standalone: true })
export class SubtotalPipe implements PipeTransform {
  transform(precio: number, cantidad: number): number {
    return precio \* cantidad;
  }
}
```

Se usa directamente en la plantilla de `cart-summary.component.html`:

```html
Q{{ item.product.precio | subtotal:item.cantidad }}
```

Se optó por un pipe en lugar de calcular el subtotal en el componente
porque es una transformación pura de datos para presentación (precio ×
cantidad → subtotal), que es exactamente el caso de uso que Angular
recomienda para pipes: mantiene la plantilla declarativa y el componente
libre de lógica de formateo.







## 6\. Comunicación entre componentes

`ProductListComponent` y `CartSummaryComponent` no se comunican
directamente entre sí (no hay `@Input()`/`@Output()` entre ellos); ambos
son "hermanos" que dependen del mismo servicio inyectado con `inject()`.

```typescript
// ProductListComponent
agregarAlCarrito(producto: Product): void {
  this.cartService.agregarProducto(producto);
}
```

```typescript
// CartSummaryComponent
private cartService = inject(CartService);
cart$ = this.cartService.cart$;
```

**Nota de implementación:** inicialmente el servicio se inyectaba por
constructor (`constructor(private cartService: CartService) {}`), pero
esto causó un error de compilación (`TS2729: Property 'cartService' is used before its initialization`), porque los campos de clase `cart$` y
`total$` se inicializan antes de que el cuerpo del constructor termine de
ejecutarse. La solución fue usar la función `inject()` de Angular como
primer campo de la clase, garantizando que `cartService` exista antes de
usarse en las siguientes líneas.

Este patrón (servicio compartido + Observable) es el recomendado en
Angular para comunicar componentes que no tienen una relación directa de
padre-hijo, a diferencia de `@Input()`/`@Output()`, que solo funcionan
entre un componente y su hijo inmediato.





## 7\. Flujo de datos completo

```
1. Usuario hace clic en "Agregar" en ProductListComponent
                    |
                    v
2. cartService.agregarProducto(producto)
   - Busca si el producto ya está en el carrito
   - Si existe: incrementa cantidad
   - Si no existe: lo agrega con cantidad = 1
   - Emite el nuevo arreglo con cartSubject.next(...)
                    |
                    v
3. cart$ emite el nuevo estado a todos los suscriptores
                    |
                    v
4. CartSummaryComponent (suscrito vía "cart$ | async")
   - Vuelve a renderizar la lista de items
   - Por cada item, el pipe "subtotal" calcula precio x cantidad
                    |
                    v
5. total$ (derivado de cart$ con map) emite el nuevo total
                    |
                    v
6. La vista muestra el total actualizado, sin recargar la página
   ni llamar manualmente a ninguna función de refresco
```

Este mismo flujo aplica igual para `actualizarCantidad` (cambiar el input
numérico) y `eliminarProducto` (botón "Eliminar"): ambos métodos terminan
llamando a `cartSubject.next(...)` con el arreglo actualizado, y todo lo
que está suscrito a `cart$` o `total$` se refresca automáticamente.



## 8\. Pruebas realizadas

Se probó manualmente el flujo completo en `http://localhost:4200`:

|Prueba|Acción|Resultado esperado|Resultado obtenido|
|-|-|-|-|
|Agregar productos distintos|Agregar Monitor, Mouse y Teclado|Aparecen 3 filas en el resumen|Correcto|
|Evitar filas duplicadas|Agregar el mismo producto dos veces|La cantidad sube en vez de duplicar la fila|Correcto|
|Actualizar cantidad|Cambiar cantidad del Monitor a 2|Subtotal del Monitor pasa de Q950 a Q1900|Correcto|
|Cálculo de subtotal (pipe)|Con Monitor x2, Mouse x1, Teclado x1|Subtotales: Q1900, Q120, Q250|Correcto|
|Cálculo de total general|Suma de los 3 subtotales anteriores|Total: Q2270|Correcto (verificado en captura de pantalla)|
|Eliminar producto|Clic en "Eliminar" sobre una fila|La fila desaparece y el total baja|Correcto|

**Evidencia:** con Monitor 24" (cantidad 2, Q950 c/u), Mouse inalámbrico
(cantidad 1, Q120) y Teclado mecánico (cantidad 1, Q250), el sistema
calculó correctamente: 2×950 + 1×120 + 1×250 = **Q2270**, coincidiendo
con el total mostrado en la interfaz.







## 9\. Conclusión

Este taller integra tres piezas centrales de Angular reactivo: un
**Observable** (`BehaviorSubject`) como fuente única de verdad del estado
del carrito, un **pipe personalizado** para transformar datos de precio y
cantidad en subtotales sin ensuciar la lógica del componente, y un patrón
de **comunicación entre componentes vía servicio compartido** en lugar de
`@Input()`/`@Output()`, apropiado para componentes que no tienen relación
padre-hijo directa. El resultado es una interfaz que se actualiza sola
ante cualquier cambio de estado, sin necesidad de refrescar manualmente
ninguna parte de la vista.







