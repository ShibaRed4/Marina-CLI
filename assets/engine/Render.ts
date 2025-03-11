import { AnimationStates } from "./Animation";

class Render {
  ctx: CanvasRenderingContext2D;
  renderQueue: Array<any>;
  renderFunctions: Array<(deltaTime: number) => void>;
  currentFrame: number;

  // New properties for optimization
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private imagesLoading: Map<string, Promise<HTMLImageElement>> = new Map();
  private assetPaths: string[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.currentFrame = 0;
    this.renderQueue = [];
    this.renderFunctions = [];

    // Create offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = ctx.canvas.width;
    this.offscreenCanvas.height = ctx.canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d")!;

    this.scanAssets();
  }

  scanAssets() {
    // This uses Vite's glob import to find all image files
    const imageModules = import.meta.glob(
      "../assets/**/*.{png,jpg,jpeg,gif,webp,svg}",
      { eager: true },
    );

    // Convert the modules to paths and extract URLs
    this.assetPaths = Object.entries(imageModules).map(([path, module]) => {
      // @ts-ignore - Vite module type
      return module.default || path;
    });

    console.log(`Found ${this.assetPaths.length} image assets`);
  }

  addItems(Instance: any) {
    this.renderQueue.push(Instance);
  }

  updateItem(updatedInstance: any): void {
    // Find the instance in the renderQueue and update it
    for (let i = 0; i < this.renderQueue.length; i++) {
      if (this.renderQueue[i] === updatedInstance) {
        // Update the instance in place
        this.renderQueue[i] = updatedInstance;
        return; // Exit after updating
      }
    }
  }

  getFrameFromSpritesheet(
    spritesheet: HTMLImageElement,
    frameIndex: number,
    frameWidth: number,
    frameHeight: number,
  ): { x: number; y: number; width: number; height: number } {
    // Calculate frames per row in the spritesheet
    const framesPerRow = Math.floor(spritesheet.width / frameWidth);

    // Calculate row and column of the frame
    const row = Math.floor(frameIndex / framesPerRow);
    const col = frameIndex % framesPerRow;

    // Calculate pixel coordinates of the frame
    return {
      x: col * frameWidth,
      y: row * frameHeight,
      width: frameWidth,
      height: frameHeight,
    };
  }

  // Improved image loading with caching
  loadImage(url: string): Promise<HTMLImageElement> {
    // If the image is already in the cache, return it immediately
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }

    // If the image is currently loading, return the existing promise
    if (this.imagesLoading.has(url)) {
      return this.imagesLoading.get(url)!;
    }

    // Otherwise, load the image
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(url, img);
        this.imagesLoading.delete(url);
        resolve(img);
      };
      img.onerror = () => {
        this.imagesLoading.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.imagesLoading.set(url, loadPromise);
    return loadPromise;
  }

  // Method to preload all assets before starting the game
  async preloadAssets(imageUrls: string[]): Promise<void> {
    const loadPromises = imageUrls.map((url) => this.loadImage(url));
    await Promise.all(loadPromises);
    console.log("All assets loaded");
  }

  // Modified unPack method using double buffering

  unPack() {
    // Reset and prepare the offscreen canvas
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.offscreenCtx.translate(
      this.offscreenCanvas.width / 2,
      this.offscreenCanvas.height / 2,
    );
    this.offscreenCtx.clearRect(
      -this.offscreenCanvas.width / 2,
      -this.offscreenCanvas.height / 2,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height,
    );

    // Draw each object to the offscreen canvas
    for (const obj of this.renderQueue) {
      const {
        instanceType,
        Position,
        ProjectedPosition,
        ProjectedSize,
        Size,
        Texture,
        Animator,
      } = obj;

      switch (instanceType) {
        case "Frame":
          if (Texture && this.imageCache.has(Texture)) {
            const htmlImage = this.imageCache.get(Texture)!;
            this.offscreenCtx.drawImage(
              htmlImage,
              Position.x - Size.x / 2,
              Position.y - Size.y / 2,
              Size.x,
              Size.y,
            );
          } else if (Texture) {
            // If texture is not in cache yet, try to load it for next frame
            // but don't render anything this frame
            this.loadImage(Texture).catch((err) => console.error(err));
          }
          break;

        case "Camera":
          // Camera rendering logic here if needed
          break;

        case "Part":
          if (Animator?.state === AnimationStates.Playing) {
            let currentAnimation = Animator.getCurrentAnimation();

            if (
              currentAnimation &&
              this.imageCache.has(currentAnimation.Image)
            ) {
              let spriteSheet = this.imageCache.get(currentAnimation.Image)!;

              // When it's time to draw the next frame
              if (this.currentFrame % currentAnimation.FPS === 0) {
                if (Animator.currentFrame >= currentAnimation.FrameAmount) {
                  Animator.currentFrame = 1;
                  Animator.finish(Animator.currentAnimation);
                } else {
                  Animator.currentFrame += 1;
                }
              }

              const frame = this.getFrameFromSpritesheet(
                spriteSheet,
                Animator.currentFrame - 1, // Adjust if your frame index starts at 1
                currentAnimation.FrameDimensions.x,
                currentAnimation.FrameDimensions.y,
              );

              // Draw to offscreen canvas
              this.offscreenCtx.drawImage(
                spriteSheet,
                frame.x,
                frame.y,
                frame.width,
                frame.height,
                ProjectedPosition.x - ProjectedSize.x / 2,
                ProjectedPosition.y - ProjectedSize.y / 2,
                ProjectedSize.x,
                ProjectedSize.y,
              );
            } else if (currentAnimation) {
              // Try to load the animation image if not already cached
              // but don't render anything this frame
              this.loadImage(currentAnimation.Image).catch((err) =>
                console.error(err),
              );
            }
          } else {
            // Check for a texture property and load it if it exists
            if (Texture && this.imageCache.has(Texture)) {
              const textureImage = this.imageCache.get(Texture)!;

              this.offscreenCtx.drawImage(
                textureImage,
                ProjectedPosition.x - ProjectedSize.x / 2,
                ProjectedPosition.y - ProjectedSize.y / 2,
                ProjectedSize.x,
                ProjectedSize.y,
              );
            } else if (Texture) {
              // Try to load the texture if not already cached
              // but don't render anything this frame
              this.loadImage(Texture).catch((err) => console.error(err));
            }
          }
          break;
      }
    }

    // Reset the offscreen canvas transform
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);

    // Copy from offscreen canvas to visible canvas in one operation
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
  }

  // Improved game loop with preloading
  async start() {
    try {
      // Make sure missing.jpg is in the list
      const missingTexturePath = "../assets/missing.jpg";
      if (!this.assetPaths.includes(missingTexturePath)) {
        this.assetPaths.push(missingTexturePath);
      }

      this.assetPaths.push("../assets/sprites/girl/Idle.png");

      // Add any textures from the render queue that might not be in the assets folder
      for (const obj of this.renderQueue) {
        if (obj.Texture && !this.assetPaths.includes(obj.Texture)) {
          this.assetPaths.push(obj.Texture);
        }
        if (obj.Animator?.animations) {
          for (const animation of Object.values(obj.Animator.animations)) {
            // @ts-ignore - Add animation image paths
            if (animation.Image && !this.assetPaths.includes(animation.Image)) {
              // @ts-ignore
              this.assetPaths.push(animation.Image);
            }
          }
        }
      }

      // Preload all assets
      console.log(`Preloading ${this.assetPaths.length} assets...`);
      await this.preloadAssets(this.assetPaths);
      console.log("All assets loaded successfully");
    } catch (error) {
      console.error("Failed to preload some assets:", error);
    }
    let lastTime = 0;

    const loop = (currentTime: number) => {
      let deltaTime = (currentTime - lastTime) / 1000;
      deltaTime = Math.min(deltaTime, 0.1); // Cap deltaTime to avoid large jumps
      lastTime = currentTime;

      this.currentFrame += 1;
      this.unPack();

      // Call renderFunctions after unPack
      for (const runtimeFunction of this.renderFunctions) {
        runtimeFunction(deltaTime);
      }

      requestAnimationFrame(loop);
    };

    loop(0); // Start the loop
  }
}

export default Render;
