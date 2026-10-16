<!--
  The family tree, in type: Carême's four as history, then the five mothers,
  each with its liaison and its liquid, and its children with what each adds,
  as nested ruled lists. A node with a written entry links it; a node a
  Brennan's dish carries names the dish (a link to its card when the house on
  this device is Brennan's and holds it).
-->
<script lang="ts">
	import type { CzTree, CzTreeNode } from '$lib/cuisine';

	let {
		tree,
		entryLink,
		dishLink
	}: {
		tree: CzTree;
		entryLink: (slug: string) => { href: string | null; title: string };
		dishLink: (id: string) => { href: string | null; name: string };
	} = $props();

	const motherName = (m: CzTreeNode) => m.name ?? (m.entry ? entryLink(m.entry).title : '');
</script>

{#snippet name(node: CzTreeNode, label: string)}
	{@const link = node.entry ? entryLink(node.entry) : null}
	{#if link?.href}<a class="nname" href={link.href}>{label}</a>{:else}<span class="nname">{label}</span>{/if}{#if node.say}<span class="say">, said {node.say}</span>{/if}
{/snippet}

{#snippet dishes(node: CzTreeNode)}
	{#if node.dishes?.length}
		<p class="dishes">
			<span class="xlabel">At Brennan's</span>
			{#each node.dishes as d, i (d.dish)}
				{@const dl = dishLink(d.dish)}{#if i}<span class="sep">{', '}</span>{/if}{#if dl.href}<a href={dl.href}>{dl.name}</a>{:else}{dl.name}{/if}
			{/each}
		</p>
	{/if}
{/snippet}

{#snippet children(list: CzTreeNode[])}
	<ul class="kids">
		{#each list as c, i (i)}
			<li>
				<p class="node">{@render name(c, c.name ?? '')}</p>
				{#if c.adds}<p class="adds">Adds: {c.adds}</p>{/if}
				{@render dishes(c)}
				{#if c.children?.length}{@render children(c.children)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<section class="careme" aria-labelledby="careme-h">
	<h2 id="careme-h">Carême's four</h2>
	<p class="four">{tree.careme.four.join(', ')}</p>
	<p class="note">{tree.careme.note}</p>
</section>

<ol class="mothers">
	{#each tree.mothers as m, i (i)}
		<li class="mother">
			<h2>{@render name(m, motherName(m))}</h2>
			<dl class="base">
				{#if m.liaison}<dt>Liaison</dt><dd>{m.liaison}</dd>{/if}
				{#if m.liquid}<dt>Liquid</dt><dd>{m.liquid}</dd>{/if}
			</dl>
			{@render dishes(m)}
			{#if m.children?.length}{@render children(m.children)}{/if}
		</li>
	{/each}
</ol>

<style>
	.careme {
		max-width: var(--measure);
		margin: 12px 0 8px;
	}
	h2 {
		font-family: var(--house-reading, var(--display));
		font-size: var(--t-h3);
		font-weight: 500;
		color: var(--turmeric-deep);
		margin: 0 0 6px;
		line-height: 1.25;
	}
	.four {
		font-family: var(--display);
		font-size: 1.25rem;
		margin: 0 0 6px;
	}
	.note {
		font-size: 1rem;
		color: var(--ink-soft);
		line-height: 1.6;
		margin: 0;
	}
	.mothers {
		list-style: none;
		margin: 16px 0 0;
		padding: 0;
	}
	.mother {
		border-top: 1px solid var(--house-frame, var(--line));
		padding: 18px 0 10px;
		max-width: var(--measure);
	}
	.base {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 2px 12px;
		margin: 4px 0 8px;
		font-size: var(--t-body);
	}
	.base dt {
		font-size: 0.9375rem;
		letter-spacing: 0.06em;
		color: var(--ink-soft);
	}
	.base dd {
		margin: 0;
	}
	.kids {
		list-style: none;
		margin: 6px 0 0;
		padding: 0 0 0 16px;
		border-left: 1px solid var(--line);
	}
	.kids > li {
		padding: 8px 0 8px 12px;
		border-top: 1px solid var(--line);
	}
	.kids > li:first-child {
		border-top: 0;
	}
	.node {
		margin: 0;
		font-size: var(--t-body);
	}
	.nname {
		font-family: var(--display);
		font-size: 1.2rem;
		color: var(--ink);
	}
	a.nname {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
	}
	h2 .nname {
		font-size: inherit;
		color: inherit;
	}
	.say {
		font-size: 1rem;
		color: var(--ink-soft);
	}
	h2 .say {
		font-family: var(--text);
		font-size: 1rem;
	}
	.adds {
		margin: 2px 0;
		font-size: 1rem;
		line-height: 1.5;
	}
	.dishes {
		margin: 4px 0;
		font-size: 1rem;
		line-height: 1.5;
	}
	.dishes a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--ink);
	}
	.xlabel {
		font-size: 0.9375rem;
		letter-spacing: 0.06em;
		color: var(--turmeric-deep);
		margin-right: 8px;
	}
</style>
