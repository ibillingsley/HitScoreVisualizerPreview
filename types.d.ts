interface Document {
	getElementById(elementId: `${string}Input`): HTMLInputElement;
	getElementById(elementId: `${string}Menu`): HTMLDetailsElement;
	getElementById(elementId: `${string}Tab`): HTMLInputElement;
	getElementById(elementId: string): HTMLElement;
}
interface Node {
	cloneNode<T>(this: T, deep?: boolean): T;
}
