/*
 * Copyright (C) 2018 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import actions from '../actions'
import {bindActionCreators} from 'redux'
import {bool, func, string, arrayOf} from 'prop-types'
import {connect} from 'react-redux'
import {debounce} from 'lodash'
import {useScope as useI18nScope} from '@canvas/i18n'
import propTypes from '../propTypes'
import React, {Component} from 'react'
import select from '@canvas/obj-select'

import {Button} from '@instructure/ui-buttons'
import DiscussionSettings from './DiscussionSettings'
import {FormField} from '@instructure/ui-form-field'
import {View} from '@instructure/ui-view'
import {Flex} from '@instructure/ui-flex'
import {IconPlusLine, IconSearchLine} from '@instructure/ui-icons'
import {PresentationContent, ScreenReaderContent} from '@instructure/ui-a11y-content'
import {TextInput} from '@instructure/ui-text-input'
import ReactDOM from 'react-dom'
import ContentTypeExternalToolTray from '@canvas/trays/react/ContentTypeExternalToolTray'
import {ltiState} from '@canvas/lti/jquery/messages'
import {SimpleSelect} from '@instructure/ui-simple-select'
import WithBreakpoints, {breakpointsShape} from '@canvas/with-breakpoints'

const I18n = useI18nScope('discussions_v2')

const filters = {
  all: I18n.t('All'),
  unread: I18n.t('Unread'),
}

const SEARCH_DELAY = 350

export default class IndexHeader extends Component {
  static propTypes = {
    breakpoints: breakpointsShape.isRequired,
    contextId: string.isRequired,
    contextType: string.isRequired,
    courseSettings: propTypes.courseSettings,
    discussionTopicIndexMenuTools: arrayOf(propTypes.discussionTopicMenuTools),
    fetchCourseSettings: func.isRequired,
    fetchUserSettings: func.isRequired,
    isSavingSettings: bool.isRequired,
    isSettingsModalOpen: bool.isRequired,
    permissions: propTypes.permissions.isRequired,
    saveSettings: func.isRequired,
    searchDiscussions: func.isRequired,
    toggleModalOpen: func.isRequired,
    userSettings: propTypes.userSettings.isRequired,
  }

  static defaultProps = {
    courseSettings: {},
    breakpoints: {},
  }

  state = {
    searchTerm: '',
    filter: 'all',
  }

  componentDidMount() {
    this.props.fetchUserSettings()
    if (this.props.contextType === 'course' && this.props.permissions.change_settings) {
      this.props.fetchCourseSettings()
    }
  }

  onSearchStringChange = e => {
    this.setState({searchTerm: e.target.value}, this.filterDiscussions)
  }

  onFilterChange = (_e, data) => {
    this.setState({filter: data.value}, this.filterDiscussions)
  }

  // This is needed to make the search results do not keep cutting each
  // other off when typing fasting and using a screen reader
  filterDiscussions = debounce(() => this.props.searchDiscussions(this.state), SEARCH_DELAY, {
    leading: false,
    trailing: true,
  })

  renderTrayToolsMenu = () => {
    if (this.props.discussionTopicIndexMenuTools?.length > 0) {
      return (
        <Flex.Item>
          <div className="inline-block">
            {/* TODO: use InstUI button */}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              className="al-trigger btn"
              id="discussion_menu_link"
              role="button"
              tabIndex="0"
              title={I18n.t('Discussions Menu')}
              aria-label={I18n.t('Discussions Menu')}
            >
              <i className="icon-more" aria-hidden="true" />
              <span className="screenreader-only">{I18n.t('Discussions Menu')}</span>
            </a>
            <ul className="al-options" role="menu">
              {this.props.discussionTopicIndexMenuTools.map(tool => (
                <li key={tool.id} role="menuitem">
                  {/* TODO: use InstUI button */}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a aria-label={tool.title} href="#" onClick={this.onLaunchTrayTool(tool)}>
                    {this.iconForTrayTool(tool)}
                    {tool.title}
                  </a>
                </li>
              ))}
            </ul>
            <div id="external-tool-mount-point" />
          </div>
        </Flex.Item>
      )
    }
  }

  iconForTrayTool(tool) {
    if (tool.canvas_icon_class) {
      return <i className={tool.canvas_icon_class} />
    } else if (tool.icon_url) {
      return <img className="icon" alt="" src={tool.icon_url} />
    }
  }

  onLaunchTrayTool = tool => e => {
    if (e != null) {
      e.preventDefault()
    }
    this.setExternalToolTray(tool, document.getElementById('discussion_settings'))
  }

  setExternalToolTray(tool, returnFocusTo) {
    const handleDismiss = () => {
      this.setExternalToolTray(null)
      returnFocusTo.focus()
      if (ltiState?.tray?.refreshOnClose) {
        window.location.reload()
      }
    }
    ReactDOM.render(
      <ContentTypeExternalToolTray
        tool={tool}
        placement="discussion_topic_index_menu"
        acceptedResourceTypes={['discussion_topic']}
        targetResourceType="discussion_topic"
        allowItemSelection={false}
        selectableItems={[]}
        onDismiss={handleDismiss}
        open={tool !== null}
      />,
      document.getElementById('external-tool-mount-point')
    )
  }

  render() {
    const {breakpoints} = this.props
    const ddSize = breakpoints.desktopOnly ? '100px' : '100%'
    const containerSize = breakpoints.tablet ? 'auto' : '100%'

    return (
      <View display="block" data-testid="discussions-index-container">
        <Flex wrap="wrap" justifyItems="end" gap="small">
          <Flex.Item size={ddSize} shouldGrow={true} shouldShrink={true}>
            <FormField
              id="discussion-filter"
              label={<ScreenReaderContent>{I18n.t('Discussion Filter')}</ScreenReaderContent>}
            >
              <SimpleSelect
                renderLabel=""
                id="discussion-filter"
                name="filter-dropdown"
                onChange={this.onFilterChange}
              >
                {Object.keys(filters).map(filter => (
                  <SimpleSelect.Option key={filter} id={filter} value={filter}>
                    {filters[filter]}
                  </SimpleSelect.Option>
                ))}
              </SimpleSelect>
            </FormField>
          </Flex.Item>
          <Flex.Item size={containerSize} shouldGrow={true} shouldShrink={true} margin="0">
            <TextInput
              renderLabel={
                <ScreenReaderContent>{I18n.t('Search discussion by title')}</ScreenReaderContent>
              }
              placeholder={I18n.t('Search by title or author...')}
              renderAfterInput={() => <IconSearchLine />}
              onChange={this.onSearchStringChange}
              name="discussion_search"
            />
          </Flex.Item>
          <Flex.Item size={containerSize}>
            <Flex wrap="no-wrap" gap="small" justifyItems="end">
              {this.props.permissions.create && (
                <Flex.Item>
                  <Button
                    href={`/${this.props.contextType}s/${this.props.contextId}/discussion_topics/new`}
                    color="primary"
                    id="add_discussion"
                    renderIcon={IconPlusLine}
                  >
                    <ScreenReaderContent>{I18n.t('Add discussion')}</ScreenReaderContent>
                    <PresentationContent>{I18n.t('Discussion')}</PresentationContent>
                  </Button>
                </Flex.Item>
              )}
              {Object.keys(this.props.userSettings).length ? (
                <Flex.Item>
                  <DiscussionSettings
                    courseSettings={this.props.courseSettings}
                    userSettings={this.props.userSettings}
                    permissions={this.props.permissions}
                    saveSettings={this.props.saveSettings}
                    toggleModalOpen={this.props.toggleModalOpen}
                    isSettingsModalOpen={this.props.isSettingsModalOpen}
                    isSavingSettings={this.props.isSavingSettings}
                  />
                </Flex.Item>
              ) : null}
              {this.renderTrayToolsMenu()}
            </Flex>
          </Flex.Item>
        </Flex>
      </View>
    )
  }
}

const connectState = state => ({
  ...select(state, [
    'contextType',
    'contextId',
    'discussionTopicIndexMenuTools',
    'permissions',
    'userSettings',
    'courseSettings',
    'isSavingSettings',
    'isSettingsModalOpen',
  ]),
})
const selectedActions = [
  'fetchUserSettings',
  'searchDiscussions',
  'fetchCourseSettings',
  'saveSettings',
  'toggleModalOpen',
]
const connectActions = dispatch => bindActionCreators(select(actions, selectedActions), dispatch)
export const ConnectedIndexHeader = WithBreakpoints(
  connect(connectState, connectActions)(IndexHeader)
)
