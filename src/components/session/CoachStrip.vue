<template>
  <div :class="['coach-strip', { coaching }]">
    <div class="infos">
      <Icon :name="coaching ? 'success' : 'coach'" class="coach-icon" />
      <div class="count">
        <Counter :count="session.subscriptions.staffCount" />
        {{ t('sessions_staff_subscribed') }}
      </div>
    </div>
    <div class="actions">
      <button
        v-if="canCheckAttendees"
        class="presence-check-button"
        @click="openModal('presence-checker', { sessionId: session.id })"
      >
        <Icon name="hand" class="icon" />
      </button>
      <button
        v-if="coaching"
        class="button subscribe secondary subscribed"
        @click="
          openModal('session-unsubscribe', {
            sessionId: session.id,
            asStaff: true,
          })
        "
      >
        {{ t('sessions_unsubscribe_as_staff') }}
      </button>
      <button
        v-else
        class="button subscribe secondary"
        @click="subscribeToSession(session.id, true)"
      >
        {{ t('sessions_subscribe_as_staff') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI36n } from '@jota-one/i36n'
import { useAuth } from '@/composables/useAuth'
import { useUserProfile } from '@/composables/useUserProfile'
import { useSessions } from '@/composables/useSessions'
import useModal from '@/composables/useModal'
import Icon from '@/components/Icon.vue'
import Counter from '@/components/Counter.vue'
import type { Session } from '@/types'

interface Props {
  session: Session
}

const props = defineProps<Props>()

const { t } = useI36n()

const { isAuthenticated } = useAuth()
const { coachingSessions } = useUserProfile()
const { subscribeToSession } = useSessions()
const { openModal } = useModal()

const coaching = computed(
  () =>
    isAuthenticated.value &&
    coachingSessions.value.map(s => s.eventId).includes(props.session.id),
)

const canCheckAttendees = computed(
  () =>
    props.session.attendees !== 'disabled' &&
    coaching.value &&
    !props.session.paused,
)
</script>

<style lang="postcss" scoped>
@import '@styles/_mediaquery.pcss';

.coach-strip {
  padding: 0.75rem var(--size-gap-20);
  display: flex;
  flex-direction: column;
  gap: var(--size-gap-10);
  background: rgb(var(--color-neutral-lightest));
  background-image: repeating-linear-gradient(
    -55deg,
    rgba(var(--color-white), 0.5),
    rgba(var(--color-white), 0.5) 1rem,
    transparent 1rem,
    transparent 2rem
  );

  @media (--r) {
    flex-direction: row;
  }

  &.coaching {
    background: rgb(var(--color-primary));
    background-image: repeating-linear-gradient(
      -55deg,
      rgba(var(--color-white), 0.1),
      rgba(var(--color-white), 0.1) 1rem,
      transparent 1rem,
      transparent 2rem
    );
    background-position: 0 -1rem;
    background-size: 100% calc(100% + 2rem);
  }
}

.infos,
.actions {
  flex: 1;
  display: flex;
}

.actions {
  align-items: center;
  justify-content: flex-end;
}

.coach-icon {
  margin: 0.35rem 0.75rem 0.35rem 0;
  width: 2.5rem;
  height: 2.5rem;
  color: rgb(var(--color-neutral-light));

  @media (--r) {
    margin-right: 2.1rem;
  }

  .coaching & {
    color: rgb(var(--color-white));
  }
}

.count {
  display: flex;
  align-items: center;
  gap: var(--size-gap-10);
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(var(--color-black), 0.8);
}

.button.subscribe {
  justify-self: flex-end;
}

.presence-check-button {
  margin: 0 0.5rem;
  border-radius: 100%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--color-white), 0.8);
  background: rgb(var(--color-primary));
  cursor: pointer;

  &:hover {
    background: rgb(var(--color-black));
    border-color: rgb(var(--color-white));
  }

  .icon {
    width: 1.5rem;
    height: 1.5rem;
    color: rgb(var(--color-white));
  }
}
</style>
