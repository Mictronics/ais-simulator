declare namespace bootstrap {
	interface ToastOptions {
		animation?: boolean;
		autohide?: boolean;
		delay?: number;
	}

	class Toast {
		constructor(element: Element, options?: ToastOptions);
		show: () => void;
		hide: () => void;
		dispose: () => void;
	}
}
