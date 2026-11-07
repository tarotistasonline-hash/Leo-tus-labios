/**
 * Real-time Visual Motion Detector for the Mouth Region
 * Compares grayscale downsampled pixels between consecutive video frames
 * to detect articulation movement and viseme activity.
 */

export class LipMotionDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private width = 64;
  private height = 48;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Process a video element's mouth crop area
   * Returns a normalized motion level 0 - 100
   */
  public detectMotion(
    video: HTMLVideoElement,
    cropX: number,
    cropY: number,
    cropW: number,
    cropH: number
  ): number {
    if (!this.ctx || !video || video.readyState < 2) return 0;

    try {
      // Draw cropped mouth area downsampled to 64x48
      this.ctx.drawImage(
        video,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        this.width,
        this.height
      );

      const frame = this.ctx.getImageData(0, 0, this.width, this.height);
      const data = frame.data;
      const totalPixels = this.width * this.height;

      if (!this.prevFrameData) {
        this.prevFrameData = new Uint8ClampedArray(data);
        return 0;
      }

      let diffSum = 0;
      // Step by 4 (RGBA)
      for (let i = 0; i < data.length; i += 4) {
        // Luminance
        const lum1 = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
        const lum2 =
          (this.prevFrameData[i] * 299 +
            this.prevFrameData[i + 1] * 587 +
            this.prevFrameData[i + 2] * 114) /
          1000;

        const delta = Math.abs(lum1 - lum2);
        // Ignore tiny camera sensor noise
        if (delta > 8) {
          diffSum += delta;
        }
      }

      // Store current frame
      this.prevFrameData.set(data);

      // Normalize average difference
      const avgDiff = diffSum / totalPixels;
      // Scale to 0-100%
      const motionScore = Math.min(100, Math.round(avgDiff * 3.5));
      return motionScore;
    } catch (e) {
      return 0;
    }
  }

  public reset() {
    this.prevFrameData = null;
  }
}
