import PropTypes from 'prop-types';

import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import classNames from 'classnames';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';
import { connect } from 'react-redux';

import {
  followAccount,
  unfollowAccount,
  unblockAccount,
  unmuteAccount,
} from 'flavours/glitch/actions/accounts';
import { openModal } from 'flavours/glitch/actions/modal';
import { Avatar } from 'flavours/glitch/components/avatar';
import { Button } from 'flavours/glitch/components/button';
import { DisplayName } from 'flavours/glitch/components/display_name';
import { IconButton } from 'flavours/glitch/components/icon_button';
import Permalink from 'flavours/glitch/components/permalink';
import { ShortNumber } from 'flavours/glitch/components/short_number';
import { autoPlayGif, me, unfollowModal } from 'flavours/glitch/initial_state';
import { makeGetAccount } from 'flavours/glitch/selectors';

const messages = defineMessages({
  unfollow: { id: 'account.unfollow', defaultMessage: 'Unfollow' },
  follow: { id: 'account.follow', defaultMessage: 'Follow' },
  cancel_follow_request: { id: 'account.cancel_follow_request', defaultMessage: 'Withdraw follow request' },
  cancelFollowRequestConfirm: { id: 'confirmations.cancel_follow_request.confirm', defaultMessage: 'Withdraw request' },
  requested: { id: 'account.requested', defaultMessage: 'Awaiting approval. Click to cancel follow request' },
  unblock: { id: 'account.unblock_short', defaultMessage: 'Unblock' },
  unmute: { id: 'account.unmute_short', defaultMessage: 'Unmute' },
  unfollowConfirm: { id: 'confirmations.unfollow.confirm', defaultMessage: 'Unfollow' },
  edit_profile: { id: 'account.edit_profile', defaultMessage: 'Edit profile' },
  dismissSuggestion: { id: 'suggestions.dismiss', defaultMessage: 'Dismiss suggestion' },
});

const makeMapStateToProps = () => {
  const getAccount = makeGetAccount();

  const mapStateToProps = (state, { id }) => ({
    account: getAccount(state, id),
  });

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch, { intl }) => ({
  onFollow(account) {
    if (account.getIn(['relationship', 'following'])) {
      if (unfollowModal) {
        dispatch(
          openModal({
            modalType: 'CONFIRM',
            modalProps: {
              message: (
                <FormattedMessage
                  id='confirmations.unfollow.message'
                  defaultMessage='Are you sure you want to unfollow {name}?'
                  values={{ name: <strong>@{account.get('acct')}</strong> }}
                />
              ),
              confirm: intl.formatMessage(messages.unfollowConfirm),
              onConfirm: () => dispatch(unfollowAccount(account.get('id'))),
            } }),
        );
      } else {
        dispatch(unfollowAccount(account.get('id')));
      }
    } else if (account.getIn(['relationship', 'requested'])) {
      if (unfollowModal) {
        dispatch(openModal({
          modalType: 'CONFIRM',
          modalProps: {
            message: <FormattedMessage id='confirmations.cancel_follow_request.message' defaultMessage='Are you sure you want to withdraw your request to follow {name}?' values={{ name: <strong>@{account.get('acct')}</strong> }} />,
            confirm: intl.formatMessage(messages.cancelFollowRequestConfirm),
            onConfirm: () => dispatch(unfollowAccount(account.get('id'))),
          },
        }));
      } else {
        dispatch(unfollowAccount(account.get('id')));
      }
    } else {
      dispatch(followAccount(account.get('id')));
    }
  },

  onBlock(account) {
    if (account.getIn(['relationship', 'blocking'])) {
      dispatch(unblockAccount(account.get('id')));
    }
  },

  onMute(account) {
    if (account.getIn(['relationship', 'muting'])) {
      dispatch(unmuteAccount(account.get('id')));
    }
  },

});

class AccountCard extends ImmutablePureComponent {

  static propTypes = {
    account: ImmutablePropTypes.map.isRequired,
    intl: PropTypes.object.isRequired,
    onFollow: PropTypes.func.isRequired,
    onBlock: PropTypes.func.isRequired,
    onMute: PropTypes.func.isRequired,
    onDismiss: PropTypes.func,
  };

  handleMouseEnter = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-original');
    }
  };

  handleMouseLeave = ({ currentTarget }) => {
    if (autoPlayGif) {
      return;
    }

    const emojis = currentTarget.querySelectorAll('.custom-emoji');

    for (var i = 0; i < emojis.length; i++) {
      let emoji = emojis[i];
      emoji.src = emoji.getAttribute('data-static');
    }
  };

  handleFollow = () => {
    this.props.onFollow(this.props.account);
  };

  handleBlock = () => {
    this.props.onBlock(this.props.account);
  };

  handleMute = () => {
    this.props.onMute(this.props.account);
  };

  handleEditProfile = () => {
    window.open('/settings/profile', '_blank');
  };

  handleDismiss = (e) => {
    const { account, onDismiss } = this.props;
    onDismiss(account.get('id'));

    e.preventDefault();
    e.stopPropagation();
  };

  render() {
    const { account, intl } = this.props;

    let actionBtn;

    if (me !== account.get('id')) {
      if (!account.get('relationship')) { // Wait until the relationship is loaded
        actionBtn = '';
      } else if (account.getIn(['relationship', 'requested'])) {
        actionBtn = <Button  text={intl.formatMessage(messages.cancel_follow_request)} title={intl.formatMessage(messages.requested)} onClick={this.handleFollow} />;
      } else if (account.getIn(['relationship', 'muting'])) {
        actionBtn = <Button  text={intl.formatMessage(messages.unmute)} onClick={this.handleMute} />;
      } else if (!account.getIn(['relationship', 'blocking'])) {
        actionBtn = <Button disabled={account.getIn(['relationship', 'blocked_by'])} className={classNames({ 'button--destructive': account.getIn(['relationship', 'following']) })} text={intl.formatMessage(account.getIn(['relationship', 'following']) ? messages.unfollow : messages.follow)} onClick={this.handleFollow} />;
      } else if (account.getIn(['relationship', 'blocking'])) {
        actionBtn = <Button  text={intl.formatMessage(messages.unblock)} onClick={this.handleBlock} />;
      }
    } else {
      actionBtn = <Button  text={intl.formatMessage(messages.edit_profile)} onClick={this.handleEditProfile} />;
    }

    return (
      <div className='account-card'>
        <Permalink href={account.get('url')} to={`/@${account.get('acct')}`} className='account-card__permalink'>
          <div className='account-card__header'>
            {this.props.onDismiss && <IconButton className='media-modal__close' title={intl.formatMessage(messages.dismissSuggestion)} icon='times' onClick={this.handleDismiss} size={20} />}

            <img
              src={
                autoPlayGif ? account.get('header') : account.get('header_static')
              }
              alt=''
            />
          </div>

          <div className='account-card__title'>
            <div className='account-card__title__avatar'><Avatar account={account} size={56} /></div>
            <DisplayName account={account} />
          </div>
        </Permalink>

        {account.get('note').length > 0 && (
          <div
            className='account-card__bio translate'
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            dangerouslySetInnerHTML={{ __html: account.get('note_emojified') }}
          />
        )}

        <div className='account-card__actions'>
          <div className='account-card__counters'>
            <div className='account-card__counters__item'>
              <ShortNumber value={account.get('statuses_count')} />
              <small>
                <FormattedMessage id='account.posts' defaultMessage='Posts' />
              </small>
            </div>

            <div className='account-card__counters__item'>
              {account.get('followers_count') < 0 ? '-' : <ShortNumber value={account.get('followers_count')} />}{' '}
              <small>
                <FormattedMessage
                  id='account.followers'
                  defaultMessage='Followers'
                />
              </small>
            </div>

            <div className='account-card__counters__item'>
              <ShortNumber value={account.get('following_count')} />{' '}
              <small>
                <FormattedMessage
                  id='account.following'
                  defaultMessage='Following'
                />
              </small>
            </div>
          </div>

          <div className='account-card__actions__button'>
            {actionBtn}
          </div>
        </div>
      </div>
    );
  }

}

export default injectIntl(connect(makeMapStateToProps, mapDispatchToProps)(AccountCard));
