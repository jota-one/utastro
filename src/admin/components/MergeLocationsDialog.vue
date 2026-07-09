<template>
  <el-dialog
    v-model="open"
    title="Fusionner des lieux"
    width="520px"
    align-center
    :close-on-click-modal="false"
    @close="emit('update:modelValue', false)"
  >
    <p>
      Toutes les sessions du lieu
      <strong>{{ item?.label_fr || item?.xid }}</strong>
      <el-tag
        v-if="eventCount !== null"
        size="small"
        effect="plain"
        class="mx-1"
      >
        {{ eventCount }} session(s)
      </el-tag>
      seront re-pointées vers le lieu de destination.
    </p>
    <el-form label-position="right" label-width="120px">
      <el-form-item label="Destination">
        <el-select
          v-model="destId"
          filterable
          placeholder="Sélectionner un lieu"
          style="width: 100%"
        >
          <el-option
            v-for="loc in destinations"
            :key="loc.id"
            :label="`${loc.cityLabel} — ${loc.label}`"
            :value="loc.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <el-alert v-if="destination" type="success" :closable="false">
      Destination : {{ destination.cityLabel }} — {{ destination.label }} ({{
        destination.xid
      }})
    </el-alert>
    <el-alert v-else type="warning" :closable="false">
      Sélectionner un lieu de destination.
    </el-alert>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Annuler</el-button>
      <el-button
        type="primary"
        :disabled="!destination"
        :loading="merging"
        @click="merge"
      >
        Fusionner
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { pb } from '@/pb'

type Props = {
  modelValue?: boolean
  item?: Record<string, any> | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  item: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'merged'): void
}>()

const BATCH_SIZE = 50

const open = ref(props.modelValue)
const merging = ref(false)
const destId = ref('')
const eventCount = ref<number | null>(null)
const destinations = ref<
  {
    id: string
    xid: string
    label: string
    cityLabel: string
    cityId: string
  }[]
>([])

const destination = computed(
  () => destinations.value.find(loc => loc.id === destId.value) || null,
)

const load = async () => {
  destId.value = ''
  eventCount.value = null
  const [locs, events] = await Promise.all([
    pb.collection('ut_locations').getFullList({
      sort: 'label_fr',
      expand: 'city',
    }),
    pb.collection('ut_events').getList(1, 1, {
      filter: `location = "${props.item!.id}"`,
      fields: 'id',
    }),
  ])
  destinations.value = locs
    .filter(loc => loc.id !== props.item!.id)
    .map(loc => ({
      id: loc.id,
      xid: loc.xid || '',
      label: loc.label_fr || loc.label_de || loc.xid || '',
      cityLabel: loc.expand?.city?.label || '',
      cityId: loc.city || '',
    }))
  eventCount.value = events.totalItems
}

const merge = async () => {
  merging.value = true
  try {
    const dest = destination.value!
    const events = await pb.collection('ut_events').getFullList({
      filter: `location = "${props.item!.id}"`,
      fields: 'id',
    })
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = pb.createBatch()
      events.slice(i, i + BATCH_SIZE).forEach(event =>
        batch.collection('ut_events').update(event.id, {
          location: dest.id,
          city: dest.cityId,
        }),
      )
      await batch.send()
    }
    ElMessage.success(`${events.length} session(s) re-pointée(s)`)
    emit('merged')
    emit('update:modelValue', false)
  } catch {
    ElMessage.error('Erreur lors de la fusion')
  } finally {
    merging.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    open.value = value
    if (value && props.item?.id) {
      load()
    }
  },
)
</script>
