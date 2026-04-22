import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders auth heading", () => {
  render(<App />);
  const headingElement = screen.getByRole("heading", {
    name: /login or create an account before you enter the game floor/i,
  });
  expect(headingElement).toBeInTheDocument();
});
