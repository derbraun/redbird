<template>
    <div class="feed">
        <h1>Search Results</h1>
        <p>Searched for {{keywords}}</p>
        <feed-list v-bind:feed="feed"/>
    </div>
</template>

<script>
    import FeedList from './FeedList';
    export default {
        name: 'SearchResults',
        components: { FeedList },
        //Created hook actually does the search
        created: function() {
            this.$store.dispatch('doSearch',this.$route.query.keywords);
        },
        computed: {
            feed: function(){
                return this.$store.getters.feed;
            },

            keywords: function() {
                return this.$route.query.keywords;
            }
        },

        //Watcher for the search if it changes
        watch: {
            '$route.query.keywords'() {
                this.$store.dispatch('doSearch',this.$route.query.keywords);
            }
        },
    }
</script>

<style scoped>

</style>