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

  getDiagonalLength() {
    return Math.sqrt(this.magnitudeX ** 2 + this.magnitudeY ** 2);
  }

  add(vector: DOMVector) {
    return new DOMVector(
      this.x + vector.x,
      this.y + vector.y,
      this.magnitudeX + vector.magnitudeX,
      this.magnitudeY + vector.magnitudeY
    );
  }

  clamp(vector: DOMRect) {
    return new DOMVector(
      this.x,
      this.y,
      Math.min(vector.width - this.x, this.magnitudeX),
      Math.min(vector.height - this.y, this.magnitudeY)
    );
  }

  toTerminalPoint(): DOMPoint {
    return new DOMPoint(this.x + this.magnitudeX, this.y + this.magnitudeY);
  }
}
