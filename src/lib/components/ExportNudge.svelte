<!--
  The export nudge: how stale the only backup is.

  The house record (menu, 86 board, costings, preps, the item book, the waste
  log) lives in this browser's IndexedDB and nowhere else. Safari deletes that
  for a site not on the home screen after seven days without a visit, and
  Chromium may evict it under pressure, so the .wtjson export is the backup and
  the app has to be able to say how old it is. Both facts come from the store:
  `house.exportNudge` (persistence/house.ts, pure and tested) compares the last
  export with the last write, and `house.storagePersisted` is what
  navigator.storage.persist() answered on the first genuine write.

  Says nothing when there is nothing to say: an empty record, an export at
  least as new as the last write, and a browser that granted durable storage
  all render no element at all.
-->
<script lang="ts">
	import { house } from '$lib/stores/house.svelte';

	/**
	 * `quiet`: one line in the soft ink at the foot of the study view's header,
	 * no box, the same facts in fewer words; `onTools` opens Session and tools,
	 * where the export lives, so the line never sends the reader hunting.
	 */
	let { quiet = false, onTools }: { quiet?: boolean; onTools?: () => void } = $props();

	const nudge = $derived(house.exportNudge);
	const persisted = $derived(house.storagePersisted);

	const ago = (days: number) =>
		days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
</script>

{#if quiet && (nudge || persisted === false)}
	<p class="quietline" data-print="hide">
		{#if nudge && nudge.days !== null}
			Last exported {ago(nudge.days)}, and the menu has changed since.
		{:else if nudge}
			Not backed up yet.
		{:else}
			This browser may not keep this data.
		{/if}
		Export from
		{#if onTools}<button class="toolsdoor" onclick={onTools}>Session and tools</button>{:else}Session and tools{/if}.
	</p>
{:else if nudge || persisted === false}
	<p class="nudge" data-print="hide">
		{#if nudge}
			{#if nudge.days === null}
				This record has never been exported.
			{:else}
				Last exported {ago(nudge.days)}, and the record has changed since.
			{/if}
		{/if}
		{#if persisted === false}
			This browser has not promised to keep this data and can evict it; the export is the backup.
		{/if}
	</p>
{/if}

<style>
	.quietline {
		margin: 2px 0 0;
		font-size: 1rem;
		line-height: 1.45;
		color: var(--ink-soft);
	}
	.toolsdoor {
		min-height: 44px;
		padding: 0 2px;
		background: none;
		border: 0;
		font: inherit;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.nudge {
		margin: 0 0 12px;
		padding: 8px 12px;
		border-left: 2px solid var(--turmeric-deep);
		background: var(--paper-raised);
		max-width: var(--measure);
		font-size: var(--t-small);
		line-height: 1.5;
		color: var(--ink);
	}
</style>
