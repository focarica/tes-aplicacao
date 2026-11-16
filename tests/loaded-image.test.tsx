import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LoadedImage } from "../src/components/LoadedImage";

afterEach(cleanup);

describe("LoadedImage", () => {
  it("keeps the image hidden until it finishes loading", () => {
    render(createElement(LoadedImage, { src: "/foto.png", alt: "Foto" }));
    const image = screen.getByAltText("Foto");

    expect(image.className).toContain("opacity-0");
    fireEvent.load(image);
    expect(image.className).toContain("opacity-100");
  });
});
