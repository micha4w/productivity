<script lang="ts">
    import { TodoType } from "./types";

    export let todo : Todo;

    const classes: string[] = [];
    classes[TodoType.Daily] = 'daily';
    classes[TodoType.Weekly] = 'weekly';
    classes[TodoType.Monthly] = 'monthly';
</script>

<div class="todo {classes[todo.type]}">
    <span class="span">
        {todo.title}
    </span>
</div>

<style>
    .span {
       display: table-cell;
       vertical-align: middle;
    }

    .todo {
        height: 3em;
        width: 10em;

        display: table;
        text-align: center;
        
        border: 2px solid var(--primary-accent-color);
        background-color: var(--primary-color);
        border-radius: .1rem;
        color: var(--secondary-text-color);
        font-weight: 450;
    }

    /*.daily {
        background-color: #7fffd4;
        border-color: #67d3af;
    }

    .weekly {
        background-color: #adff2f;
        border-color: 91d828;
    }

    .monthly {
        background-color: #ff7b00;
        border-color: #d16501;
    }*/
</style>