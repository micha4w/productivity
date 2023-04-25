// See https://kit.svelte.dev/docs/types#app

// for information about these interfaces
declare global {
	type ISODate = string;

	interface Score {
		todos: number,
		points: number
	};

	interface Todo {
		id?: number;
		title: string;
		points: number;
		start: ISODate;
		end?: ISODate;
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