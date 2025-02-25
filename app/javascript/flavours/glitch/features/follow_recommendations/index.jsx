import PropTypes from 'prop-types';

import { FormattedMessage } from 'react-intl';

import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';

import { requestBrowserPermission } from 'flavours/glitch/actions/notifications';
import { changeSetting, saveSettings } from 'flavours/glitch/actions/settings';
import { fetchSuggestions } from 'flavours/glitch/actions/suggestions';
import { markAsPartial } from 'flavours/glitch/actions/timelines';
import { Button } from 'flavours/glitch/components/button';
import Column from 'flavours/glitch/features/ui/components/column';
import { WithRouterPropTypes } from 'flavours/glitch/utils/react_router';
import imageGreeting from 'mastodon/../images/elephant_ui_greeting.svg';

import Account from './components/account';

const mapStateToProps = state => ({
  suggestions: state.getIn(['suggestions', 'items']),
  isLoading: state.getIn(['suggestions', 'isLoading']),
});

class FollowRecommendations extends ImmutablePureComponent {

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    suggestions: ImmutablePropTypes.list,
    isLoading: PropTypes.bool,
    ...WithRouterPropTypes,
  };

  componentDidMount () {
    const { dispatch, suggestions } = this.props;

    // Don't re-fetch if we're e.g. navigating backwards to this page,
    // since we don't want followed accounts to disappear from the list

    if (suggestions.size === 0) {
      dispatch(fetchSuggestions(true));
    }
  }

  componentWillUnmount () {
    const { dispatch } = this.props;

    // Force the home timeline to be reloaded when the user navigates
    // to it; if the user is new, it would've been empty before

    dispatch(markAsPartial('home'));
  }

  handleDone = () => {
    const { history, dispatch } = this.props;

    dispatch(requestBrowserPermission((permission) => {
      if (permission === 'granted') {
        dispatch(changeSetting(['notifications', 'alerts', 'follow'], true));
        dispatch(changeSetting(['notifications', 'alerts', 'favourite'], true));
        dispatch(changeSetting(['notifications', 'alerts', 'reblog'], true));
        dispatch(changeSetting(['notifications', 'alerts', 'mention'], true));
        dispatch(changeSetting(['notifications', 'alerts', 'poll'], true));
        dispatch(changeSetting(['notifications', 'alerts', 'status'], true));
        dispatch(saveSettings());
      }
    }));

    history.push('/home');
  };

  render () {
    const { suggestions, isLoading } = this.props;

    return (
      <Column>
        <div className='scrollable follow-recommendations-container'>
          <div className='column-title'>
            <svg viewBox='0 0 79 79' className='logo'>
              <use xlinkHref='#logo-symbol-icon' />
            </svg>

            <h3><FormattedMessage id='follow_recommendations.heading' defaultMessage="Follow people you'd like to see posts from! Here are some suggestions." /></h3>
            <p><FormattedMessage id='follow_recommendations.lead' defaultMessage="Posts from people you follow will show up in chronological order on your home feed. Don't be afraid to make mistakes, you can unfollow people just as easily any time!" /></p>
          </div>

          {!isLoading && (
            <>
              <div className='column-list'>
                {suggestions.size > 0 ? suggestions.map(suggestion => (
                  <Account key={suggestion.get('account')} id={suggestion.get('account')} />
                )) : (
                  <div className='column-list__empty-message'>
                    <FormattedMessage id='empty_column.follow_recommendations' defaultMessage='Looks like no suggestions could be generated for you. You can try using search to look for people you might know or explore trending hashtags.' />
                  </div>
                )}
              </div>

              <div className='column-actions'>
                <img src={imageGreeting} alt='' className='column-actions__background' />
                <Button onClick={this.handleDone}><FormattedMessage id='follow_recommendations.done' defaultMessage='Done' /></Button>
              </div>
            </>
          )}
        </div>

        <Helmet>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }

}

export default withRouter(connect(mapStateToProps)(FollowRecommendations));
