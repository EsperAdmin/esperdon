import api, { getLinks } from '../api';

import { fetchRelationships } from './accounts';
import { importFetchedAccounts, importFetchedStatus } from './importer';

export const REBLOG_REQUEST = 'REBLOG_REQUEST';
export const REBLOG_SUCCESS = 'REBLOG_SUCCESS';
export const REBLOG_FAIL    = 'REBLOG_FAIL';

export const REBLOGS_EXPAND_REQUEST = 'REBLOGS_EXPAND_REQUEST';
export const REBLOGS_EXPAND_SUCCESS = 'REBLOGS_EXPAND_SUCCESS';
export const REBLOGS_EXPAND_FAIL = 'REBLOGS_EXPAND_FAIL';

export const FAVOURITE_REQUEST = 'FAVOURITE_REQUEST';
export const FAVOURITE_SUCCESS = 'FAVOURITE_SUCCESS';
export const FAVOURITE_FAIL    = 'FAVOURITE_FAIL';

export const UNREBLOG_REQUEST = 'UNREBLOG_REQUEST';
export const UNREBLOG_SUCCESS = 'UNREBLOG_SUCCESS';
export const UNREBLOG_FAIL    = 'UNREBLOG_FAIL';

export const UNFAVOURITE_REQUEST = 'UNFAVOURITE_REQUEST';
export const UNFAVOURITE_SUCCESS = 'UNFAVOURITE_SUCCESS';
export const UNFAVOURITE_FAIL    = 'UNFAVOURITE_FAIL';

export const REBLOGS_FETCH_REQUEST = 'REBLOGS_FETCH_REQUEST';
export const REBLOGS_FETCH_SUCCESS = 'REBLOGS_FETCH_SUCCESS';
export const REBLOGS_FETCH_FAIL    = 'REBLOGS_FETCH_FAIL';

export const FAVOURITES_FETCH_REQUEST = 'FAVOURITES_FETCH_REQUEST';
export const FAVOURITES_FETCH_SUCCESS = 'FAVOURITES_FETCH_SUCCESS';
export const FAVOURITES_FETCH_FAIL    = 'FAVOURITES_FETCH_FAIL';

export const FAVOURITES_EXPAND_REQUEST = 'FAVOURITES_EXPAND_REQUEST';
export const FAVOURITES_EXPAND_SUCCESS = 'FAVOURITES_EXPAND_SUCCESS';
export const FAVOURITES_EXPAND_FAIL = 'FAVOURITES_EXPAND_FAIL';

export const PIN_REQUEST = 'PIN_REQUEST';
export const PIN_SUCCESS = 'PIN_SUCCESS';
export const PIN_FAIL    = 'PIN_FAIL';

export const UNPIN_REQUEST = 'UNPIN_REQUEST';
export const UNPIN_SUCCESS = 'UNPIN_SUCCESS';
export const UNPIN_FAIL    = 'UNPIN_FAIL';

export const BOOKMARK_REQUEST = 'BOOKMARK_REQUEST';
export const BOOKMARK_SUCCESS = 'BOOKMARKED_SUCCESS';
export const BOOKMARK_FAIL    = 'BOOKMARKED_FAIL';

export const UNBOOKMARK_REQUEST = 'UNBOOKMARKED_REQUEST';
export const UNBOOKMARK_SUCCESS = 'UNBOOKMARKED_SUCCESS';
export const UNBOOKMARK_FAIL    = 'UNBOOKMARKED_FAIL';

export const REACTION_UPDATE = 'REACTION_UPDATE';

export const REACTION_ADD_REQUEST = 'REACTION_ADD_REQUEST';
export const REACTION_ADD_SUCCESS = 'REACTION_ADD_SUCCESS';
export const REACTION_ADD_FAIL    = 'REACTION_ADD_FAIL';

export const REACTION_REMOVE_REQUEST = 'REACTION_REMOVE_REQUEST';
export const REACTION_REMOVE_SUCCESS = 'REACTION_REMOVE_SUCCESS';
export const REACTION_REMOVE_FAIL    = 'REACTION_REMOVE_FAIL';

export function reblog(status, visibility) {
  return function (dispatch, getState) {
    dispatch(reblogRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/reblog`, { visibility }).then(function (response) {
      // The reblog API method returns a new status wrapped around the original. In this case we are only
      // interested in how the original is modified, hence passing it skipping the wrapper
      dispatch(importFetchedStatus(response.data.reblog));
      dispatch(reblogSuccess(status));
    }).catch(function (error) {
      dispatch(reblogFail(status, error));
    });
  };
}

export function unreblog(status) {
  return (dispatch, getState) => {
    dispatch(unreblogRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/unreblog`).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(unreblogSuccess(status));
    }).catch(error => {
      dispatch(unreblogFail(status, error));
    });
  };
}

export function reblogRequest(status) {
  return {
    type: REBLOG_REQUEST,
    status: status,
  };
}

export function reblogSuccess(status) {
  return {
    type: REBLOG_SUCCESS,
    status: status,
  };
}

export function reblogFail(status, error) {
  return {
    type: REBLOG_FAIL,
    status: status,
    error: error,
  };
}

export function unreblogRequest(status) {
  return {
    type: UNREBLOG_REQUEST,
    status: status,
  };
}

export function unreblogSuccess(status) {
  return {
    type: UNREBLOG_SUCCESS,
    status: status,
  };
}

export function unreblogFail(status, error) {
  return {
    type: UNREBLOG_FAIL,
    status: status,
    error: error,
  };
}

export function favourite(status) {
  return function (dispatch, getState) {
    dispatch(favouriteRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/favourite`).then(function (response) {
      dispatch(importFetchedStatus(response.data));
      dispatch(favouriteSuccess(status));
    }).catch(function (error) {
      dispatch(favouriteFail(status, error));
    });
  };
}

export function unfavourite(status) {
  return (dispatch, getState) => {
    dispatch(unfavouriteRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/unfavourite`).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(unfavouriteSuccess(status));
    }).catch(error => {
      dispatch(unfavouriteFail(status, error));
    });
  };
}

export function favouriteRequest(status) {
  return {
    type: FAVOURITE_REQUEST,
    status: status,
  };
}

export function favouriteSuccess(status) {
  return {
    type: FAVOURITE_SUCCESS,
    status: status,
  };
}

export function favouriteFail(status, error) {
  return {
    type: FAVOURITE_FAIL,
    status: status,
    error: error,
  };
}

export function unfavouriteRequest(status) {
  return {
    type: UNFAVOURITE_REQUEST,
    status: status,
  };
}

export function unfavouriteSuccess(status) {
  return {
    type: UNFAVOURITE_SUCCESS,
    status: status,
  };
}

export function unfavouriteFail(status, error) {
  return {
    type: UNFAVOURITE_FAIL,
    status: status,
    error: error,
  };
}

export function bookmark(status) {
  return function (dispatch, getState) {
    dispatch(bookmarkRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/bookmark`).then(function (response) {
      dispatch(importFetchedStatus(response.data));
      dispatch(bookmarkSuccess(status));
    }).catch(function (error) {
      dispatch(bookmarkFail(status, error));
    });
  };
}

export function unbookmark(status) {
  return (dispatch, getState) => {
    dispatch(unbookmarkRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/unbookmark`).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(unbookmarkSuccess(status));
    }).catch(error => {
      dispatch(unbookmarkFail(status, error));
    });
  };
}

export function bookmarkRequest(status) {
  return {
    type: BOOKMARK_REQUEST,
    status: status,
  };
}

export function bookmarkSuccess(status) {
  return {
    type: BOOKMARK_SUCCESS,
    status: status,
  };
}

export function bookmarkFail(status, error) {
  return {
    type: BOOKMARK_FAIL,
    status: status,
    error: error,
  };
}

export function unbookmarkRequest(status) {
  return {
    type: UNBOOKMARK_REQUEST,
    status: status,
  };
}

export function unbookmarkSuccess(status) {
  return {
    type: UNBOOKMARK_SUCCESS,
    status: status,
  };
}

export function unbookmarkFail(status, error) {
  return {
    type: UNBOOKMARK_FAIL,
    status: status,
    error: error,
  };
}

export function fetchReblogs(id) {
  return (dispatch, getState) => {
    dispatch(fetchReblogsRequest(id));

    api(getState).get(`/api/v1/statuses/${id}/reblogged_by`).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(importFetchedAccounts(response.data));
      dispatch(fetchReblogsSuccess(id, response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => {
      dispatch(fetchReblogsFail(id, error));
    });
  };
}

export function fetchReblogsRequest(id) {
  return {
    type: REBLOGS_FETCH_REQUEST,
    id,
  };
}

export function fetchReblogsSuccess(id, accounts, next) {
  return {
    type: REBLOGS_FETCH_SUCCESS,
    id,
    accounts,
    next,
  };
}

export function fetchReblogsFail(id, error) {
  return {
    type: REBLOGS_FETCH_FAIL,
    id,
    error,
  };
}

export function expandReblogs(id) {
  return (dispatch, getState) => {
    const url = getState().getIn(['user_lists', 'reblogged_by', id, 'next']);
    if (url === null) {
      return;
    }

    dispatch(expandReblogsRequest(id));

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');

      dispatch(importFetchedAccounts(response.data));
      dispatch(expandReblogsSuccess(id, response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => dispatch(expandReblogsFail(id, error)));
  };
}

export function expandReblogsRequest(id) {
  return {
    type: REBLOGS_EXPAND_REQUEST,
    id,
  };
}

export function expandReblogsSuccess(id, accounts, next) {
  return {
    type: REBLOGS_EXPAND_SUCCESS,
    id,
    accounts,
    next,
  };
}

export function expandReblogsFail(id, error) {
  return {
    type: REBLOGS_EXPAND_FAIL,
    id,
    error,
  };
}

export function fetchFavourites(id) {
  return (dispatch, getState) => {
    dispatch(fetchFavouritesRequest(id));

    api(getState).get(`/api/v1/statuses/${id}/favourited_by`).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');
      dispatch(importFetchedAccounts(response.data));
      dispatch(fetchFavouritesSuccess(id, response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => {
      dispatch(fetchFavouritesFail(id, error));
    });
  };
}

export function fetchFavouritesRequest(id) {
  return {
    type: FAVOURITES_FETCH_REQUEST,
    id,
  };
}

export function fetchFavouritesSuccess(id, accounts, next) {
  return {
    type: FAVOURITES_FETCH_SUCCESS,
    id,
    accounts,
    next,
  };
}

export function fetchFavouritesFail(id, error) {
  return {
    type: FAVOURITES_FETCH_FAIL,
    id,
    error,
  };
}

export function expandFavourites(id) {
  return (dispatch, getState) => {
    const url = getState().getIn(['user_lists', 'favourited_by', id, 'next']);
    if (url === null) {
      return;
    }

    dispatch(expandFavouritesRequest(id));

    api(getState).get(url).then(response => {
      const next = getLinks(response).refs.find(link => link.rel === 'next');

      dispatch(importFetchedAccounts(response.data));
      dispatch(expandFavouritesSuccess(id, response.data, next ? next.uri : null));
      dispatch(fetchRelationships(response.data.map(item => item.id)));
    }).catch(error => dispatch(expandFavouritesFail(id, error)));
  };
}

export function expandFavouritesRequest(id) {
  return {
    type: FAVOURITES_EXPAND_REQUEST,
    id,
  };
}

export function expandFavouritesSuccess(id, accounts, next) {
  return {
    type: FAVOURITES_EXPAND_SUCCESS,
    id,
    accounts,
    next,
  };
}

export function expandFavouritesFail(id, error) {
  return {
    type: FAVOURITES_EXPAND_FAIL,
    id,
    error,
  };
}

export function pin(status) {
  return (dispatch, getState) => {
    dispatch(pinRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/pin`).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(pinSuccess(status));
    }).catch(error => {
      dispatch(pinFail(status, error));
    });
  };
}

export function pinRequest(status) {
  return {
    type: PIN_REQUEST,
    status,
  };
}

export function pinSuccess(status) {
  return {
    type: PIN_SUCCESS,
    status,
  };
}

export function pinFail(status, error) {
  return {
    type: PIN_FAIL,
    status,
    error,
  };
}

export function unpin (status) {
  return (dispatch, getState) => {
    dispatch(unpinRequest(status));

    api(getState).post(`/api/v1/statuses/${status.get('id')}/unpin`).then(response => {
      dispatch(importFetchedStatus(response.data));
      dispatch(unpinSuccess(status));
    }).catch(error => {
      dispatch(unpinFail(status, error));
    });
  };
}

export function unpinRequest(status) {
  return {
    type: UNPIN_REQUEST,
    status,
  };
}

export function unpinSuccess(status) {
  return {
    type: UNPIN_SUCCESS,
    status,
  };
}

export function unpinFail(status, error) {
  return {
    type: UNPIN_FAIL,
    status,
    error,
  };
};

export const addReaction = (statusId, name, url) => (dispatch, getState) => {
  const status = getState().get('statuses').get(statusId);
  let alreadyAdded = false;
  if (status) {
    const reaction = status.get('reactions').find(x => x.get('name') === name);
    if (reaction && reaction.get('me')) {
      alreadyAdded = true;
    }
  }
  if (!alreadyAdded) {
    dispatch(addReactionRequest(statusId, name, url));
  }

  // encodeURIComponent is required for the Keycap Number Sign emoji, see:
  // <https://github.com/glitch-soc/mastodon/pull/1980#issuecomment-1345538932>
  api(getState).post(`/api/v1/statuses/${statusId}/react/${encodeURIComponent(name)}`).then(() => {
    dispatch(addReactionSuccess(statusId, name));
  }).catch(err => {
    if (!alreadyAdded) {
      dispatch(addReactionFail(statusId, name, err));
    }
  });
};

export const addReactionRequest = (statusId, name, url) => ({
  type: REACTION_ADD_REQUEST,
  id: statusId,
  name,
  url,
});

export const addReactionSuccess = (statusId, name) => ({
  type: REACTION_ADD_SUCCESS,
  id: statusId,
  name,
});

export const addReactionFail = (statusId, name, error) => ({
  type: REACTION_ADD_FAIL,
  id: statusId,
  name,
  error,
});

export const removeReaction = (statusId, name) => (dispatch, getState) => {
  dispatch(removeReactionRequest(statusId, name));

  api(getState).post(`/api/v1/statuses/${statusId}/unreact/${encodeURIComponent(name)}`).then(() => {
    dispatch(removeReactionSuccess(statusId, name));
  }).catch(err => {
    dispatch(removeReactionFail(statusId, name, err));
  });
};

export const removeReactionRequest = (statusId, name) => ({
  type: REACTION_REMOVE_REQUEST,
  id: statusId,
  name,
});

export const removeReactionSuccess = (statusId, name) => ({
  type: REACTION_REMOVE_SUCCESS,
  id: statusId,
  name,
});

export const removeReactionFail = (statusId, name) => ({
  type: REACTION_REMOVE_FAIL,
  id: statusId,
  name,
});
