<template>
    <div class="feed">
        <h1>Hashtag Results</h1>
        <p>Searched for #{{hashtag}}</p>
        <feed-list v-bind:feed="feed"/>
    </div>
</template>
<script>
    import FeedList from './FeedList';
    export default {
        name: 'HashTag',
        components: { FeedList },

        // Does the first search
        created: function() {
            this.$store.dispatch('doHashTagSearch',this.$route.params.hashtag);
        },
        computed: {
            feed:function(){
                return this.$store.getters.feed;
            },

            hashtag: function() {
                return this.$route.params.hashtag;
            }
        },

        //Does additional searches
        watch: {
            '$route.params.hashtag'() {
                this.$store.dispatch('doHashTagSearch',this.$route.params.hashtag);
            }
        },
    }
</script>

<style scoped>

</style>