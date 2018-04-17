<template>
    <div class="feed">
        <h2>
            {{userView.name}} @{{userView.username}}
        </h2>
        <feed-list v-bind:feed="feed" />
    </div>
</template>

<script>
    import FeedList from './FeedList';
    export default {
        name: 'UserPage',
        components: { FeedList },
        created: function() {
            this.$store.dispatch('getUser',{id:this.$route.params.userID});
            this.$store.dispatch('getUserTweets',{id:this.$route.params.userID});
        },
        computed: {
            user: function() {
                return this.$store.getters.user;
            },
            userView: function() {
                return this.$store.getters.userView;
            },
            feed: function() {
                return this.$store.getters.feedView;
            },
        },
    }
</script>

<style scoped>

</style>