<template>
  <Modal id="session-unsubscribe">
    <SessionUnsubscribeConfirm />
  </Modal>
  <Modal id="presence-checker">
    <SessionPresenceChecker />
  </Modal>
</template>

<script setup lang="ts">
import Modal from '@/components/Modal.vue'
import SessionUnsubscribeConfirm from '@/components/session/UnsubscribeConfirm.vue'
import SessionPresenceChecker from '@/components/session/PresenceChecker.vue'
</script>
