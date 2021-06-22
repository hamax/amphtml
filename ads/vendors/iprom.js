/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {parseJson} from '#core/types/object/json';
import {validateData, writeScript} from '#3p/3p';

/**
 * @param {!Window} global
 * @param {!Object} data
 */
export function iprom(global, data) {
  validateData(data, ['zone', 'sitepath'], ['keywords', 'channels']);

  const ampdata = {
    sitepath: '[]',
    zone: [],
    keywords: '',
    channels: '',
    ...data,
  };

  /**
   * Callback for WriteScript
   */
  function namespaceLoaded() {
    const ipromNS = window.ipromNS || {};

    ipromNS.AdTag = ipromNS.AdTag || {};

    const config = {
      sitePath: parseJson(ampdata.sitepath),
      containerId: 'c',
      zoneId: ampdata.zone,
      prebid: true,
      amp: true,
      keywords: ampdata.keywords ? ampdata.keywords.split(',') : [],
      channels: ampdata.channels ? ampdata.channels.split(',') : [],
    };

    const tag = new ipromNS.AdTag(config);
    tag.init();
  }

  writeScript(global, 'https://cdn.ipromcloud.com/ipromNS.js', namespaceLoaded);
}
