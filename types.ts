export interface LoadingState {
  image: boolean;
  quote: boolean;
  hashtags: boolean;
  generateImage: boolean;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type QuotePosition = "top" | "center" | "bottom";

export interface Font {
  name: string;
  family: string;
  className: string;
}

export interface ColorPalette {
  name: string;
  textColor: string;
  bgColor: string;
  textShadow?: string;
}
