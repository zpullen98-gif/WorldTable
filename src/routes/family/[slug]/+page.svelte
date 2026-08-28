<script lang="ts">
	import RecipeDetailView from '$lib/components/RecipeDetailView.svelte';
	let { data } = $props();
</script>

<RecipeDetailView
	summary={data.summary}
	detail={data.detail}
	pairing={data.pairing}
	substitutions={data.substitutions}
	judged={data.judged}
/>
