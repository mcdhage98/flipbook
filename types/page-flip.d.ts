declare module "page-flip" {
  export class PageFlip {
    constructor(
      element: HTMLElement,
      settings: Record<string, string | number | boolean>,
    );
    loadFromHTML(pages: HTMLElement[]): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(event: string, callback: (event: { data: unknown }) => void): this;
    destroy(): void;
  }
}
