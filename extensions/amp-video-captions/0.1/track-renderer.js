/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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

import {toArray} from '../../../src/core/types/array';
import {listen} from '../../../src/event-helper';

// Class used for sections of text that is in the future (for ASR-style captions).
const FUTURE_CUE_SECTION_CLASS = 'amp-video-captions-future';

/**
 * Parses WebVTT timestamps and returns the timestamp in seconds (from the start of the video).
 * https://www.w3.org/TR/webvtt1/#webvtt-timestamp
 * @param {string} text
 * @return {?number}
 */
function parseTimestamp(timestamp) {
  const match = /^(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})$/.exec(timestamp);
  if (!match) {
    return null;
  }
  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

export class TrackRenderer {
  constructor(video, track, container) {
    this.video_ = video;

    this.track_ = track;

    this.element_ = container.ownerDocument.createElement('div');
    container.appendChild(this.element_);

    this.cueTimestamps_ = [];

    this.render_();
    this.cueChangeUnlistener_ = listen(track, 'cuechange', () => {
      this.render_();
    });

    this.timeUpdateUnlistener_ = listen(video, 'timeupdate', () => {
      this.updateTime_();
    })
  }

  dispose() {
    this.cueChangeUnlistener_();
    this.timeUpdateUnlistener_();
    this.element_.parentNode.removeChild(this.element_);
  }

  /** Render currently active cues. */
  render_() {
    this.element_.innerHTML = '';
    this.cueTimestamps_ = [];
    toArray(this.track_.activeCues).forEach((cue) => {
      const cueElement = this.element_.ownerDocument.createElement('div');
      cueElement.style.position = 'absolute';
      cueElement.style.left = '0';
      cueElement.style.right = '0';
      cueElement.style.bottom = '0';

      const html = cue.getCueAsHTML();
      let section = this.element_.ownerDocument.createElement('span');
      cueElement.appendChild(section);
      const timestamps = [];
      toArray(html.childNodes).forEach((node) => {
        if (node.target === 'timestamp') {
          const timestamp = parseTimestamp(node.data);
          if (timestamp !== null) {
            timestamps.push(timestamp);
            // Create a new section after each timestamp, so the style can easily be updated based on time.
            section = this.element_.ownerDocument.createElement('span');
            cueElement.appendChild(section);
          }
        } else {
          section.appendChild(node);
        }
      });

      this.cueTimestamps_.push(timestamps);
      this.element_.appendChild(cueElement);
    });
    this.updateTime_();
  }

  /** Update cue style based on the current video time (for ASR-style captions). */
  updateTime_() {
    const videoTime = this.video_.currentTime;
    toArray(this.element_.childNodes).forEach((cue, i) => {
      toArray(cue.childNodes).forEach((section, j) => {
        // The first section always has implicit timestamp 0, so it's never in the future.
        if (j > 0) {
          if (this.cueTimestamps_[i][j - 1] > videoTime) {
            section.classList.add(FUTURE_CUE_SECTION_CLASS);
          } else {
            section.classList.remove(FUTURE_CUE_SECTION_CLASS);
          }
        }
      });
    });
  }
}