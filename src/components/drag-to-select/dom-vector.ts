export class DOMVector {
  readonly x: number;
  readonly y: number;
  readonly magnitudeX: number;
  readonly magnitudeY: number;

  constructor(x: number, y: number, magnitudeX: number, magnitudeY: number) {
    this.x = x;
    this.y = y;
    this.magnitudeX = magnitudeX;
    this.magnitudeY = magnitudeY;
  }

  toDOMRect() {
    return new DOMRect(
      Math.min(this.x, this.x + this.magnitudeX),
      Math.min(this.y, this.y + this.magnitudeY),
      Math.abs(this.magnitudeX),
      Math.abs(this.magnitudeY)
    );
  }
}
