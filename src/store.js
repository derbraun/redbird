import Vue from 'vue';
import Vuex from 'vuex';

import axios from 'axios';

Vue.use(Vuex);

export default new Vuex.Store({
    //State allows us to store the local copy of the data our app uses,
    state: {
        user: {},
        loggedIn: false,
        loginError: '',
        registerError: '',
        feed: [],
    },

    //Getters allow components to read the state
    getters: {
        user: state => state.user,
        loggedIn: state => state.loggedIn,
        loginError: state => state.loginError,
        registerError: state => state.registerError,
        feed: state => state.feed,
    },

    //Mutations allow components to change the state
    mutations: {
        setUser (state, user) {
            state.user = user;
        },
        setLogin (state, status) {
            state.loggedIn = status;
        },
        setLoginError (state, message) {
            state.loginError = message;
        },
        setRegisterError (state, message) {
            state.registerError = message;
        },
        setFeed (state, feed) {
            state.feed = feed;
        },
    },

    //Actions allow the components to call asynchronous functions
    actions: {

        // Registration call for user
        register(context,user) {
            axios.post("/api/users",user).then(response => {
                context.commit('setUser', response.data.user);
                context.commit('setLogin',true);
                context.commit('setRegisterError',"");
                context.commit('setLoginError',"");
            }).catch(error => {
                context.commit('setLoginError',"");
                context.commit('setLogin',false);
                if (error.response) {
                    if (error.response.status === 403)
                        context.commit('setRegisterError',"That email address already has an account.");
                    else if (error.response.status === 409)
                        context.commit('setRegisterError',"That user name is already taken.");
                    return;
                }
                context.commit('setRegisterError',"Sorry, your request failed. We will look into it.");
            });
        },

        //Login call for user
        login(context,user) {
            axios.post("/api/login",user).then(response => {
                context.commit('setUser', response.data.user);
                context.commit('setLogin',true);
                context.commit('setRegisterError',"");
                context.commit('setLoginError',"");
            }).catch(error => {
                context.commit('setRegisterError',"");
                if (error.response) {
                    if (error.response.status === 403 || error.response.status === 400)
                        context.commit('setLoginError',"Invalid login.");
                    context.commit('setRegisterError',"");
                    return;
                }
                context.commit('setLoginError',"Sorry, your request failed. We will look into it.");
            });
        },

        //Call to log user out
        logout(context,user) {
            context.commit('setUser', {});
            context.commit('setLogin',false);
        },

        // Call to Get the Tweets
        getFeed(context) {
            axios.get("/api/users/" + context.state.user.id + "/tweets").then(response => {
                context.commit('setFeed',response.data.tweets);
            }).catch(err => {
                console.log("getFeed failed:",err);
            });
        },

        // Call to Add a tweet to a user
        addTweet(context,tweet) {
            axios.post("/api/users/" + context.state.user.id + "/tweets",tweet).then(response => {
                return context.dispatch('getFeed');
            }).catch(err => {
                console.log("addTweet failed:",err);
            });
        }
    }
    }
});