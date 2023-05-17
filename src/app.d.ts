// See https://kit.svelte.dev/docs/types#app

// for information about these interfaces
declare global {
	type SQLDate = string;

	interface Score {
		todos: number,
		points: number
	};

	interface Todo {
		id?: number;
		title: string;
		points: number;
		start: SQLDate;
		end?: SQLDate;
		type: TodoType;
		frequency: number;
		repeat: number;
		done?: boolean;
	};

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	};
}

export {};