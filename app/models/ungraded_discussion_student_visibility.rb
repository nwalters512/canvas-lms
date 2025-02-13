# frozen_string_literal: true

#
# Copyright (C) 2024 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

class UngradedDiscussionStudentVisibility < ActiveRecord::Base
  include VisibilityPluckingHelper

  def readonly?
    true
  end

  def self.where_with_guard(*args)
    if Account.site_admin.feature_enabled?(:differentiated_modules)
      raise StandardError, "UngradedDiscussionStudentVisibility view should not be used when differentiated_modules site admin flag is on.  Use UngradedDiscussionVisibilityService instead"
    end

    where_without_guard(*args)
  end

  class << self
    alias_method :where_without_guard, :where
    alias_method :where, :where_with_guard
  end

  before_destroy { raise ActiveRecord::ReadOnlyRecord }
end
