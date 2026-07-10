<template>
  <div class="presence-checker">
    <BlockTitle :text="t('presence_checker_title')" />
    <div v-if="sessionAttendeesStatus !== 'checked'" class="wrapper">
      <div v-if="enabled" v-html="t('presence_checker_intro')" />
      <div
        v-else
        v-html="
          t('presence_checker_active_at', {
            date: enabledDate?.format('dddd DD MMM YYYY @HH:mm'),
          })
        "
      ></div>
      <div class="counts">
        <span>{{ t('presence_checker_checked_count') }}:</span>
        <span
          ><b> {{ presenceCheckedCount }}</b> /
          {{ sessionAttendees?.length }}
        </span>
      </div>
    </div>
    <br />
    <div :class="['wrapper', { disabled: !enabled }]">
      <ul class="attendees">
        <li
          v-for="attendee in sessionAttendees"
          :key="attendee.subscriptionId"
          :class="[
            'attendee',
            {
              'is-present': attendee.presence === true,
              'is-absent': attendee.presence === false,
            },
          ]"
        >
          <div class="person">
            <span class="name">
              <b>{{ attendee.name }}</b>
            </span>
          </div>
          <div class="buttons">
            <button
              class="present"
              :disabled="!enabled"
              @click="setPresence(attendee, true)"
            >
              <Icon name="success" class="icon" />
            </button>
            <button
              class="absent"
              :disabled="!enabled"
              @click="setPresence(attendee, false)"
            >
              <Icon name="close" class="icon" />
            </button>
          </div>
        </li>
      </ul>
      <div
        v-if="
          config.presenceCheckValidation &&
          presenceCheckedCount > 0 &&
          presenceCheckedCount === sessionAttendees?.length &&
          sessionAttendeesStatus === 'todo'
        "
        class="validate"
      >
        <div class="body">
          <button class="button primary big" @click="validate">
            {{ t('presence_checker_validate_button') }}
          </button>
          <p>{{ t('presence_checker_validate_info') }}</p>
        </div>
      </div>
      <div v-if="sessionAttendeesStatus === 'checked'" class="validate">
        <div class="body">
          <Icon name="success" color-theme="success" class="checked-icon" />
          <b>{{ t('presence_checker_validated') }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useSessions } from '@/composables/useSessions'
import useModal from '@/composables/useModal'
import { useLocaleDate } from '@/composables/useLocaleDate'
import config from '@/config'
import Icon from '@/components/Icon.vue'
import BlockTitle from '@/components/content/BlockTitle.vue'
import type { Attendee } from '@/types'

const { t } = useI36n()
const { modalParams } = useModal()
const { getLocaleDate } = useLocaleDate()
const {
  sessionDetail,
  sessionAttendees,
  sessionAttendeesStatus,
  loadAttendees,
  loadSession,
  setAttendeePresence,
  validateAttendees,
} = useSessions()

const enabledDate = computed(
  () =>
    sessionDetail.value &&
    getLocaleDate(sessionDetail.value.start).add(-30, 'days'),
)

const enabled = computed(
  () => enabledDate.value && enabledDate.value.isBefore(dayjs()),
)

const presenceCheckedCount = computed(
  () =>
    sessionAttendees.value?.filter(attendee => attendee.presence !== null)
      .length || 0,
)

const setPresence = async (attendee: Attendee, presence: boolean) => {
  await setAttendeePresence(attendee, presence)
  await loadAttendees(modalParams.value.sessionId)
}

const validate = async () => {
  await validateAttendees(modalParams.value.sessionId)
  await loadAttendees(modalParams.value.sessionId)
}

loadSession(modalParams.value.sessionId)
loadAttendees(modalParams.value.sessionId)
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.presence-checker {
  width: var(--size-content-width-tq);
  max-width: 100%;
  padding: 0 1rem 2rem;
}

.wrapper {
  position: relative;

  &.disabled {
    opacity: 0.6;
  }
}

.counts {
  display: flex;
  gap: var(--size-gap-20);
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid rgb(var(--color-neutral-lighter));
}

.attendees {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-10);
}

.attendee {
  display: flex;
  flex-direction: column;
  padding: 1rem 0.75rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(var(--color-white), 0.4);
  box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.1);

  @media (--m) {
    flex-direction: row;
    justify-content: space-between;
    padding: 0.75rem;
  }

  &:hover {
    background: rgb(var(--color-white));
  }

  &.is-present {
    color: rgb(var(--color-white));
    background: rgb(var(--color-success-text));
  }

  &.is-absent {
    color: rgb(var(--color-white));
    background: rgb(var(--color-error-text));
  }
}

.person {
  display: flex;
  align-items: center;
  gap: var(--size-gap-10);
  padding-left: 0.5rem;
  text-transform: capitalize;
}

.buttons {
  padding-top: 0.25rem;

  @media (--m) {
    padding-top: 0;
  }

  display: flex;
  gap: var(--size-gap-10);

  button {
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 0.25rem;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    cursor: pointer;

    &.present {
      background: rgb(var(--color-success-bg));

      .icon {
        color: rgb(var(--color-success-text));
      }

      .is-present & {
        background: transparent;
        box-shadow: none;

        .icon {
          color: rgb(var(--color-white));
        }
      }

      .is-absent & {
        background: rgba(var(--color-white), 0.1);

        .icon {
          color: rgba(var(--color-white), 0.4);
        }
      }
    }

    &.absent {
      background: rgb(var(--color-error-bg));

      .icon {
        color: rgb(var(--color-error-text));
      }

      .is-present & {
        background: rgba(var(--color-white), 0.1);

        .icon {
          color: rgba(var(--color-white), 0.4);
        }
      }

      .is-absent & {
        background: transparent;
        box-shadow: none;

        .icon {
          color: rgb(var(--color-white));
        }
      }
    }

    &:hover {
      &.present {
        background: rgb(var(--color-success-text));

        .icon {
          color: rgb(var(--color-white));
        }
      }

      &.absent {
        background: rgb(var(--color-error-text));

        .icon {
          color: rgb(var(--color-white));
        }
      }
    }
  }

  .icon {
    margin: 0.25rem;
  }
}

.validate {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: rgba(var(--color-bg), 0.9);

  .body {
    position: sticky;
    top: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .checked-icon {
    width: 4rem;
    height: 4rem;
  }
}
</style>
