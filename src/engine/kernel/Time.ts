export class Time {
  private static _dt: number = 0;
  private static _time: number = 0;
  private static _frameCount: number = 0;

  public static get dt(): number {
    return this._dt;
  }

  public static get time(): number {
    return this._time;
  }

  public static get frameCount(): number {
    return this._frameCount;
  }

  /**
   * Called by the Kernel Loop to update frame stats.
   */
  public static tick(dt: number, time: number) {
    this._dt = dt;
    this._time = time;
    this._frameCount++;
  }
}
