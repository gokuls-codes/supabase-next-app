import { signal } from "@preact/signals-react";

export const userName = signal("");

export function changeName(newName: string) {
  userName.value = newName;
}
