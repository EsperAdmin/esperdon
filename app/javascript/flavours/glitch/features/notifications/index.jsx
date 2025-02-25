import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';
import { Helmet } from 'react-helmet';

import { List as ImmutableList } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { debounce } from 'lodash';

import { addColumn, removeColumn, moveColumn } from 'flavours/glitch/actions/columns';
import { submitMarkers } from 'flavours/glitch/actions/markers';
import {
  enterNotificationClearingMode,
  expandNotifications,
  scrollTopNotifications,
  loadPending,
  mountNotifications,
  unmountNotifications,
  markNotificationsAsRead,
} from 'flavours/glitch/actions/notifications';
import { compareId } from 'flavours/glitch/compare_id';
import Column from 'flavours/glitch/components/column';
import ColumnHeader from 'flavours/glitch/components/column_header';
import { Icon } from 'flavours/glitch/components/icon';
import { LoadGap } from 'flavours/glitch/components/load_gap';
import { NotSignedInIndicator } from 'flavours/glitch/components/not_signed_in_indicator';
import ScrollableList from 'flavours/glitch/components/scrollable_list';
import NotificationPurgeButtonsContainer from 'flavours/glitch/containers/notification_purge_buttons_container';

import NotificationsPermissionBanner from './components/notifications_permission_banner';
import ColumnSettingsContainer from './containers/column_settings_container';
import FilterBarContainer from './containers/filter_bar_container';
import NotificationContainer from './containers/notification_container';






const messages = defineMessages({
  title: { id: 'column.notifications', defaultMessage: 'Notifications' },
  enterNotifCleaning : { id: 'notification_purge.start', defaultMessage: 'Enter notification cleaning mode' },
  markAsRead : { id: 'notifications.mark_as_read', defaultMessage: 'Mark every notification as read' },
});

const getExcludedTypes = createSelector([
  state => state.getIn(['settings', 'notifications', 'shows']),
], (shows) => {
  return ImmutableList(shows.filter(item => !item).keys());
});

const getNotifications = createSelector([
  state => state.getIn(['settings', 'notifications', 'quickFilter', 'show']),
  state => state.getIn(['settings', 'notifications', 'quickFilter', 'active']),
  getExcludedTypes,
  state => state.getIn(['notifications', 'items']),
], (showFilterBar, allowedType, excludedTypes, notifications) => {
  if (!showFilterBar || allowedType === 'all') {
    // used if user changed the notification settings after loading the notifications from the server
    // otherwise a list of notifications will come pre-filtered from the backend
    // we need to turn it off for FilterBar in order not to block ourselves from seeing a specific category
    return notifications.filterNot(item => item !== null && excludedTypes.includes(item.get('type')));
  }
  return notifications.filter(item => item === null || allowedType === item.get('type'));
});

const mapStateToProps = state => ({
  showFilterBar: state.getIn(['settings', 'notifications', 'quickFilter', 'show']),
  notifications: getNotifications(state),
  localSettings:  state.get('local_settings'),
  isLoading: state.getIn(['notifications', 'isLoading'], 0) > 0,
  isUnread: state.getIn(['notifications', 'unread']) > 0 || state.getIn(['notifications', 'pendingItems']).size > 0,
  hasMore: state.getIn(['notifications', 'hasMore']),
  numPending: state.getIn(['notifications', 'pendingItems'], ImmutableList()).size,
  notifCleaningActive: state.getIn(['notifications', 'cleaningMode']),
  lastReadId: state.getIn(['settings', 'notifications', 'showUnread']) ? state.getIn(['notifications', 'readMarkerId']) : '0',
  canMarkAsRead: state.getIn(['settings', 'notifications', 'showUnread']) && state.getIn(['notifications', 'readMarkerId']) !== '0' && getNotifications(state).some(item => item !== null && compareId(item.get('id'), state.getIn(['notifications', 'readMarkerId'])) > 0),
  needsNotificationPermission: state.getIn(['settings', 'notifications', 'alerts']).includes(true) && state.getIn(['notifications', 'browserSupport']) && state.getIn(['notifications', 'browserPermission']) === 'default' && !state.getIn(['settings', 'notifications', 'dismissPermissionBanner']),
  grouping: state.getIn(['settings', 'notifications', 'grouping']),
});

/* glitch */
const mapDispatchToProps = dispatch => ({
  onEnterCleaningMode(yes) {
    dispatch(enterNotificationClearingMode(yes));
  },
  dispatch,
});

class Notifications extends PureComponent {

  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    columnId: PropTypes.string,
    notifications: ImmutablePropTypes.list.isRequired,
    showFilterBar: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    isUnread: PropTypes.bool,
    multiColumn: PropTypes.bool,
    hasMore: PropTypes.bool,
    numPending: PropTypes.number,
    localSettings: ImmutablePropTypes.map,
    notifCleaningActive: PropTypes.bool,
    onEnterCleaningMode: PropTypes.func,
    lastReadId: PropTypes.string,
    canMarkAsRead: PropTypes.bool,
    needsNotificationPermission: PropTypes.bool,
    grouping: ImmutablePropTypes.map,
  };

  static defaultProps = {
    trackScroll: true,
  };

  state = {
    animatingNCD: false,
  };

  componentDidMount() {
    this.props.dispatch(mountNotifications());
  }

  componentWillUnmount () {
    this.handleLoadOlder.cancel();
    this.handleScrollToTop.cancel();
    this.handleScroll.cancel();
    // this.props.dispatch(scrollTopNotifications(false));
    this.props.dispatch(unmountNotifications());
  }

  handleLoadGap = (maxId) => {
    this.props.dispatch(expandNotifications({ maxId }));
  };

  handleLoadOlder = debounce(() => {
    const last = this.props.notifications.last();
    this.props.dispatch(expandNotifications({ maxId: last && last.get('id') }));
  }, 300, { leading: true });

  handleLoadPending = () => {
    this.props.dispatch(loadPending());
  };

  handleScrollToTop = debounce(() => {
    this.props.dispatch(scrollTopNotifications(true));
  }, 100);

  handleScroll = debounce(() => {
    this.props.dispatch(scrollTopNotifications(false));
  }, 100);

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('NOTIFICATIONS', {}));
    }
  };

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  };

  handleHeaderClick = () => {
    this.column.scrollTop();
  };

  setColumnRef = c => {
    this.column = c;
  };

  handleMoveUp = id => {
    const elementIndex = this.props.notifications.findIndex(item => item !== null && item.get('id') === id) - 1;
    this._selectChild(elementIndex, true);
  };

  handleMoveDown = id => {
    const elementIndex = this.props.notifications.findIndex(item => item !== null && item.get('id') === id) + 1;
    this._selectChild(elementIndex, false);
  };

  _selectChild (index, align_top) {
    const container = this.column.node;
    const element = container.querySelector(`article:nth-of-type(${index + 1}) .focusable`);

    if (element) {
      if (align_top && container.scrollTop > element.offsetTop) {
        element.scrollIntoView(true);
      } else if (!align_top && container.scrollTop + container.clientHeight < element.offsetTop + element.offsetHeight) {
        element.scrollIntoView(false);
      }
      element.focus();
    }
  }

  handleTransitionEndNCD = () => {
    this.setState({ animatingNCD: false });
  };

  onEnterCleaningMode = () => {
    this.setState({ animatingNCD: true });
    this.props.onEnterCleaningMode(!this.props.notifCleaningActive);
  };

  handleMarkAsRead = () => {
    this.props.dispatch(markNotificationsAsRead());
    this.props.dispatch(submitMarkers({ immediate: true }));
  };

  /**
   * Gets the list of notifications, grouped up (as per user settings) such that multiple users' interactions on the same
   * post are collapsed into a single notification.
   */
  getGroupedNotifications() {
    const { notifications, grouping } = this.props;
    const groupedNotifications = [];

    // if grouping is { "favourite": true, "reblog": false, "foo": true, "bar": false }
    // then typesToGroup is [ "favourite", "foo" ]
    const typesToGroup = grouping.reduce((acc, enabled, groupBy) => enabled ? acc.push(groupBy) : acc, ImmutableList.of());

    // for each notification....
    for (const notif of notifications) {

      // `null` is used to signify that there is a "loading gap" in the notifications. We make sure that these loading gaps persist.
      if (!notif) {
        groupedNotifications.push(notif);
        continue;
      }

      // Make sure that we only group up notifications of the provided types.
      if (typesToGroup.includes(notif.get('type'))) {

        // Get an already existing notification to collapse into
        const matchingNotifIdx = groupedNotifications.findIndex(
          other => other?.get('type') === notif.get('type') && other?.get('status') === notif.get('status'),
        );
        const matchingNotif = groupedNotifications[matchingNotifIdx];

        // Collapse this notifcation into the existing notification if it exists,
        // otherwise push it as a new notification.
        if (matchingNotif) {
          groupedNotifications[matchingNotifIdx] = matchingNotif.update(
            'account',
            ImmutableList(),
            accounts => accounts.push(notif.get('account')),
          );
        } else {
          groupedNotifications.push(notif.update('account', singleAccount => ImmutableList.of(singleAccount)));
        }
      } else {
        groupedNotifications.push(notif);
      }
    }
    return ImmutableList(groupedNotifications);
  }

  render () {
    const { intl, isLoading, isUnread, columnId, multiColumn, hasMore, numPending, showFilterBar, lastReadId, canMarkAsRead, needsNotificationPermission } = this.props;
    const { notifCleaningActive } = this.props;
    const { animatingNCD } = this.state;
    const pinned = !!columnId;
    const emptyMessage = <FormattedMessage id='empty_column.notifications' defaultMessage="You don't have any notifications yet. When other people interact with you, you will see it here." />;
    const { signedIn } = this.context.identity;

    let scrollableContent = null;

    const filterBarContainer = (signedIn && showFilterBar)
      ? (<FilterBarContainer />)
      : null;

    const notifications = this.getGroupedNotifications();

    if (isLoading && this.scrollableContent) {
      scrollableContent = this.scrollableContent;
    } else if (notifications.size > 0 || hasMore) {
      scrollableContent = notifications.map((item, index) => item === null ? (
        <LoadGap
          key={'gap:' + notifications.getIn([index + 1, 'id'])}
          disabled={isLoading}
          maxId={index > 0 ? notifications.getIn([index - 1, 'id']) : null}
          onClick={this.handleLoadGap}
        />
      ) : (
        <NotificationContainer
          key={item.get('id')}
          notification={item}
          accountId={item.get('account')}
          onMoveUp={this.handleMoveUp}
          onMoveDown={this.handleMoveDown}
          unread={lastReadId !== '0' && compareId(item.get('id'), lastReadId) > 0}
        />
      ));
    } else {
      scrollableContent = null;
    }

    this.scrollableContent = scrollableContent;

    let scrollContainer;

    if (signedIn) {
      scrollContainer = (
        <ScrollableList
          scrollKey={`notifications-${columnId}`}
          trackScroll={!pinned}
          isLoading={isLoading}
          showLoading={isLoading && notifications.size === 0}
          hasMore={hasMore}
          numPending={numPending}
          prepend={needsNotificationPermission && <NotificationsPermissionBanner />}
          alwaysPrepend
          emptyMessage={emptyMessage}
          onLoadMore={this.handleLoadOlder}
          onLoadPending={this.handleLoadPending}
          onScrollToTop={this.handleScrollToTop}
          onScroll={this.handleScroll}
          bindToDocument={!multiColumn}
        >
          {scrollableContent}
        </ScrollableList>
      );
    } else {
      scrollContainer = <NotSignedInIndicator />;
    }

    const extraButtons = [];

    if (canMarkAsRead) {
      extraButtons.push(
        <button
          key='mark-as-read'
          aria-label={intl.formatMessage(messages.markAsRead)}
          title={intl.formatMessage(messages.markAsRead)}
          onClick={this.handleMarkAsRead}
          className='column-header__button'
        >
          <Icon id='check' />
        </button>,
      );
    }

    const notifCleaningButtonClassName = classNames('column-header__button', {
      'active': notifCleaningActive,
    });

    const notifCleaningDrawerClassName = classNames('ncd column-header__collapsible', {
      'collapsed': !notifCleaningActive,
      'animating': animatingNCD,
    });

    const msgEnterNotifCleaning = intl.formatMessage(messages.enterNotifCleaning);

    extraButtons.push(
      <button
        key='notif-cleaning'
        aria-label={msgEnterNotifCleaning}
        title={msgEnterNotifCleaning}
        onClick={this.onEnterCleaningMode}
        className={notifCleaningButtonClassName}
      >
        <Icon id='eraser' />
      </button>,
    );

    const notifCleaningDrawer = (
      <div className={notifCleaningDrawerClassName} onTransitionEnd={this.handleTransitionEndNCD}>
        <div className='column-header__collapsible-inner nopad-drawer'>
          {(notifCleaningActive || animatingNCD) ? (<NotificationPurgeButtonsContainer />) : null }
        </div>
      </div>
    );

    return (
      <Column
        bindToDocument={!multiColumn}
        ref={this.setColumnRef}
        name='notifications'
        extraClasses={this.props.notifCleaningActive ? 'notif-cleaning' : null}
        label={intl.formatMessage(messages.title)}
      >
        <ColumnHeader
          icon='bell'
          active={isUnread}
          title={intl.formatMessage(messages.title)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
          localSettings={this.props.localSettings}
          extraButton={extraButtons}
          appendContent={notifCleaningDrawer}
        >
          <ColumnSettingsContainer />
        </ColumnHeader>

        {filterBarContainer}
        {scrollContainer}

        <Helmet>
          <title>{intl.formatMessage(messages.title)}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(Notifications));
