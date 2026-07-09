<template>
  <el-dialog
    v-model="open"
    title="Importer des sessions"
    width="80%"
    align-center
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div v-if="importMode === 'upload'">
      <p class="flex items-center gap-1 mb-4">
        <el-icon :size="20"><Warning /></el-icon>
        L'import crée uniquement des sessions. Les lieux et villes doivent
        exister au préalable (colonne «&nbsp;location&nbsp;» = code du lieu).
      </p>
      <el-upload
        :show-file-list="false"
        drag
        accept=".csv"
        :http-request="doUpload"
      >
        <el-icon :class="['el-icon--upload', { 'is-loading': uploading }]">
          <UploadFilled v-if="!uploading" />
          <Loading v-else />
        </el-icon>
        <div v-if="!uploading" class="el-upload__text">
          Déposer le fichier ici ou <em>cliquer pour sélectionner</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            Fichier CSV (séparateur virgule). Colonnes obligatoires :
            start_date, end_date, max_subscriptions, location, lang, activity.
          </div>
        </template>
      </el-upload>
    </div>

    <div v-if="importMode === 'preview'">
      <div class="flex mb-2">
        <p class="flex-1 flex flex-col">
          <span>
            {{ activeEvents.length }} session(s) sur
            {{ importableEvents.length }} prête(s) à être importée(s)
          </span>
          <span v-if="erroredEvents.length" class="error">
            {{ erroredEvents.length }} ligne(s) en erreur (non importables)
          </span>
        </p>
        <el-radio-group v-model="activeLang" size="small">
          <el-radio-button value="fr">fr</el-radio-button>
          <el-radio-button value="de">de</el-radio-button>
          <el-radio-button value="en">en</el-radio-button>
        </el-radio-group>
      </div>
      <el-table
        :data="events"
        stripe
        max-height="350"
        :row-class-name="rowClass"
      >
        <el-table-column label="Lieu">
          <template #default="{ row }">
            <span v-if="isCellError(row.location)" class="error">
              <el-tooltip :content="row.location.code">
                [{{ row.location.value }}]
              </el-tooltip>
            </span>
            <div v-else>
              <h4 class="font-semibold">{{ row.location.cityLabel }}</h4>
              {{
                row.location[`label_${activeLang}`] || row.location.xid || '—'
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Types">
          <template #default="{ row }">
            <template v-for="act in row.activity" :key="act.value || act.id">
              <el-tag
                v-if="isCellError(act)"
                type="danger"
                class="mr-1 mb-1 cursor-pointer"
                @click="createEventType(act.value)"
              >
                <el-tooltip :content="`${act.code} — cliquer pour créer`">
                  <span>[{{ act.value }}]</span>
                </el-tooltip>
              </el-tag>
              <el-tag v-else type="warning" class="mr-1 mb-1">
                {{ act[`label_${activeLang}`] || act.xid }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="Début" width="150">
          <template #default="{ row }">
            <span v-if="isCellError(row.start_date)" class="error">
              <el-tooltip :content="row.start_date.code">
                [{{ row.start_date.value }}]
              </el-tooltip>
            </span>
            <span v-else>{{ formatDateTime(row.start_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Fin" width="150">
          <template #default="{ row }">
            <span v-if="isCellError(row.end_date)" class="error">
              <el-tooltip :content="row.end_date.code">
                [{{ row.end_date.value }}]
              </el-tooltip>
            </span>
            <span v-else>{{ formatDateTime(row.end_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Max" width="70">
          <template #default="{ row }">
            <span v-if="isCellError(row.max_subscriptions)" class="error">
              <el-tooltip :content="row.max_subscriptions.code">
                [{{ row.max_subscriptions.value }}]
              </el-tooltip>
            </span>
            <span v-else>{{ row.max_subscriptions }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Description" width="380">
          <template #default="{ row }">
            <div :class="{ italic: !row.title || !row.title[activeLang] }">
              <h4 class="font-semibold">
                {{ (row.title && row.title[activeLang]) || '[non traduit]' }}
              </h4>
              {{
                (row.description && row.description[activeLang]) ||
                '[non traduit]'
              }}
            </div>
          </template>
        </el-table-column>
        <el-table-column width="60">
          <template #default="{ row }">
            <el-switch
              v-if="row.importable"
              v-model="row.import"
              inline-prompt
              :active-icon="Check"
              :inactive-icon="Close"
            />
            <el-icon v-else size="20" color="var(--el-color-error)">
              <CircleClose />
            </el-icon>
          </template>
        </el-table-column>
      </el-table>
      <el-progress
        v-if="uploading"
        class="mt-4"
        :percentage="submitProgress"
        :stroke-width="12"
        striped
        striped-flow
      />
    </div>

    <div v-if="importMode === 'done'">
      <div class="flex justify-center mb-8">
        <el-icon size="100" color="var(--el-color-success)">
          <Select />
        </el-icon>
      </div>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card>
            <el-statistic title="Lignes traitées" :value="uploadedLines" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic
              title="Sessions générées"
              :value="importResult.nbEvents"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic
              title="Sessions créées"
              :value="importResult.inserted.length"
            />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic
              title="Doublons ignorés"
              :value="importResult.duplicates.length"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <div class="flex">
        <div class="flex-1 text-left">
          <el-button
            v-if="importMode !== 'upload'"
            @click="importMode = 'upload'"
          >
            Nouvel import
          </el-button>
          <el-button @click="close">Fermer</el-button>
        </div>
        <el-button
          v-if="importMode === 'preview'"
          type="primary"
          :loading="uploading"
          :disabled="activeEvents.length === 0"
          @click="submit"
        >
          Importer
        </el-button>
      </div>
    </template>

    <EventTypeDialog
      v-model="showEventTypeDialog"
      :prefill="eventTypePrefill"
      @saved="onNewEventTypeCreated"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import Papa from 'papaparse'
import { ElMessage } from 'element-plus'
import {
  Check,
  CircleClose,
  Close,
  Loading,
  Select,
  UploadFilled,
  Warning,
} from '@element-plus/icons-vue'
import { pb } from '@/pb'
import EventTypeDialog from './EventTypeDialog.vue'

dayjs.extend(customParseFormat)

type Props = {
  modelValue?: boolean
}

type CellError = { error: true; value: string; code: string }

type ImportResult = {
  nbEvents: number
  inserted: string[]
  duplicates: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'imported'): void
}>()

const MANDATORY_COLUMNS = [
  'start_date',
  'end_date',
  'max_subscriptions',
  'location',
  'lang',
  'activity',
]
const I18N_FIELDS = ['title', 'description'] as const

const open = ref(props.modelValue)
const importMode = ref<'upload' | 'preview' | 'done'>('upload')
const uploading = ref(false)
const submitProgress = ref(0)
const events = ref<Record<string, any>[]>([])
const uploadedLines = ref(0)
const activeLang = ref<'fr' | 'de' | 'en'>('fr')
const lastFile = ref<File | null>(null)
const importResult = ref<ImportResult>({
  nbEvents: 0,
  inserted: [],
  duplicates: [],
})
const showEventTypeDialog = ref(false)
const eventTypePrefill = ref<Record<string, any> | null>(null)

const activeEvents = computed(() => events.value.filter(ev => ev.import))
const importableEvents = computed(() =>
  events.value.filter(ev => ev.importable),
)
const erroredEvents = computed(() => events.value.filter(ev => !ev.importable))

const isCellError = (value: unknown): value is CellError =>
  Boolean(value) && typeof value === 'object' && (value as any).error === true

const cellError = (uploadedValue?: string, errorCode?: string): CellError => ({
  error: true,
  value: uploadedValue ?? 'manquant',
  code: uploadedValue ? errorCode || 'INVALID' : 'NOT_PROVIDED',
})

const formatDateTime = (value: string) =>
  dayjs(value).format('DD.MM.YYYY HH:mm')

const parseCsv = (file: File) =>
  new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: resolve,
      error: reject,
    })
  })

const sanitizeLine = (line: Record<string, string>) => {
  return Object.entries(line).reduce(
    (acc: Record<string, any>, [field, value]) => {
      if (String(value ?? '').trim() === '') {
        if (
          ['start_date', 'end_date', 'max_subscriptions', 'location'].includes(
            field,
          )
        ) {
          acc[field] = cellError()
          acc.importable = false
        }
        return acc
      }

      if (['start_date', 'end_date'].includes(field)) {
        const parsed = dayjs(value, 'YYYY-MM-DD HH:mm')
        if (
          ![value, value.slice(0, -3)].includes(
            parsed.format('YYYY-MM-DD HH:mm'),
          )
        ) {
          acc[field] = cellError(value, 'DATE_BAD_FORMAT')
          acc.importable = false
          return acc
        }
        acc[field] = parsed
        return acc
      }
      if (field === 'end_recurrence') {
        acc[field] = dayjs(value, 'YYYY-MM-DD')
        return acc
      }

      if (['max_subscriptions', 'recurrence'].includes(field)) {
        const num = Number(value)
        if (Number.isNaN(num)) {
          acc[field] = cellError(value, 'NOT_A_NUMBER')
          acc.importable = false
          return acc
        }
        acc[field] = num
        return acc
      }

      if (field === 'location') {
        acc[field] = value.trim()
        return acc
      }

      if (field === 'activity') {
        acc[field] = value.split(',').map(act => act.trim())
        return acc
      }

      if ((I18N_FIELDS as readonly string[]).includes(field)) {
        if (!acc[field]) {
          acc[field] = {}
        }
        acc[field][line.lang] = value
        return acc
      }

      if (field === 'lang') {
        return acc
      }

      acc[field] = value
      return acc
    },
    {},
  )
}

const groupKey = (line: Record<string, any>) =>
  JSON.stringify(
    ['start_date', 'end_date', 'recurrence', 'end_recurrence', 'location'].map(
      field => {
        const value = line[field]
        return dayjs.isDayjs(value) ? value.format('YYYY-MM-DD HH:mm') : value
      },
    ),
  )

const doUpload = async (options: { file: File }) => {
  lastFile.value = options.file
  uploading.value = true
  try {
    const result = await parseCsv(options.file)
    const rows = result.data
    if (rows.length === 0) {
      throw new Error('Fichier vide')
    }

    const headers = Object.keys(rows[0])
    const missing = MANDATORY_COLUMNS.filter(col => !headers.includes(col))
    if (missing.length > 0) {
      throw new Error(
        `Colonnes obligatoires manquantes : ${missing.join(', ')}`,
      )
    }

    const sanitized = rows.map(sanitizeLine)

    // Merge multi-lang lines describing the same event
    const merged = sanitized.reduce((acc: Record<string, any>[], line) => {
      line.groupKey = groupKey(line)
      const existing = acc.find(item => item.groupKey === line.groupKey)
      if (existing) {
        I18N_FIELDS.forEach(field => {
          existing[field] = { ...existing[field], ...line[field] }
        })
        return acc
      }
      acc.push(line)
      return acc
    }, [])

    // Expand recurring events
    const expanded = merged.reduce((acc: Record<string, any>[], line) => {
      const base = { ...line }
      delete base.recurrence
      delete base.end_recurrence
      delete base.groupKey
      if (
        Number(line.recurrence) > 0 &&
        dayjs.isDayjs(line.start_date) &&
        dayjs.isDayjs(line.end_date)
      ) {
        let next = line.start_date
        let nextEnd = line.end_date
        do {
          acc.push({ ...base, start_date: next, end_date: nextEnd })
          next = next.add(line.recurrence, 'day')
          nextEnd = nextEnd.add(line.recurrence, 'day')
        } while (!next.isAfter(line.end_recurrence, 'day'))
        return acc
      }
      acc.push(base)
      return acc
    }, [])

    // Resolve locations and event types by xid
    const locationXids = [
      ...new Set(
        expanded.map(ev => ev.location).filter(loc => typeof loc === 'string'),
      ),
    ]
    const typeXids = [
      ...new Set(
        expanded.flatMap(ev => (Array.isArray(ev.activity) ? ev.activity : [])),
      ),
    ]

    const [locationRecords, typeRecords] = await Promise.all([
      locationXids.length
        ? pb.collection('ut_locations').getFullList({
            filter: locationXids.map(xid => `xid = "${xid}"`).join(' || '),
            expand: 'city',
          })
        : Promise.resolve([]),
      typeXids.length
        ? pb.collection('ut_event_types').getFullList({
            filter: typeXids.map(xid => `xid = "${xid}"`).join(' || '),
          })
        : Promise.resolve([]),
    ])

    const locationsByXid = Object.fromEntries(
      locationRecords.map(loc => [
        loc.xid,
        {
          id: loc.id,
          xid: loc.xid,
          cityId: loc.city,
          cityLabel: loc.expand?.city?.label || '',
          label_fr: loc.label_fr,
          label_de: loc.label_de,
          label_en: loc.label_en,
        },
      ]),
    )
    const typesByXid = Object.fromEntries(
      typeRecords.map(type => [
        type.xid,
        {
          id: type.id,
          xid: type.xid,
          label_fr: type.label_fr,
          label_de: type.label_de,
          label_en: type.label_en,
        },
      ]),
    )

    events.value = expanded.map(ev => {
      let importable = ev.importable !== false

      if (Array.isArray(ev.activity)) {
        ev.activity = ev.activity.map(
          (act: string) => typesByXid[act] || cellError(act, 'NOT_FOUND'),
        )
      }

      if (typeof ev.location === 'string') {
        if (locationsByXid[ev.location]) {
          ev.location = locationsByXid[ev.location]
        } else {
          ev.location = cellError(ev.location, 'NOT_FOUND')
          importable = false
        }
      }

      return { ...ev, importable, import: importable }
    })
    uploadedLines.value = rows.length
    importMode.value = 'preview'
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "Erreur lors de l'import")
  } finally {
    uploading.value = false
  }
}

const createEventType = (xid: string) => {
  eventTypePrefill.value = { xid }
  showEventTypeDialog.value = true
}

const onNewEventTypeCreated = () => {
  if (lastFile.value) {
    return doUpload({ file: lastFile.value })
  }
}

// PocketBase default batch.maxRequests is 50 — stay within it so the import
// works even on instances where the limit was not raised.
const BATCH_SIZE = 50

const duplicateKey = (record: Record<string, any>) =>
  [
    record.start_date,
    record.end_date,
    record.location,
    record.max_subscriptions,
  ].join('|')

const submit = async () => {
  uploading.value = true
  submitProgress.value = 0
  try {
    const result: ImportResult = {
      nbEvents: activeEvents.value.length,
      inserted: [],
      duplicates: [],
    }

    const payloads = activeEvents.value.map(ev => ({
      start_date: ev.start_date.format('YYYY-MM-DD HH:mm:00'),
      end_date: ev.end_date.format('YYYY-MM-DD HH:mm:00'),
      subscription_publish_date:
        ev.subscription_publish_date ||
        ev.start_date.subtract(7, 'day').format('YYYY-MM-DD HH:mm:00'),
      max_subscriptions: ev.max_subscriptions,
      progress: 'open',
      attendees: 'todo',
      location: ev.location.id,
      city: ev.location.cityId,
      types: (ev.activity || [])
        .filter((act: Record<string, any>) => Boolean(act.id))
        .map((act: Record<string, any>) => act.id),
      title_fr: ev.title?.fr || '',
      title_de: ev.title?.de || '',
      title_en: ev.title?.en || '',
      description_fr: ev.description?.fr || '',
      description_de: ev.description?.de || '',
      description_en: ev.description?.en || '',
    }))

    // Single query over the import date span instead of one query per event
    const starts = payloads.map(p => p.start_date).sort()
    const existing = await pb.collection('ut_events').getFullList({
      filter: `start_date >= "${starts[0]}" && start_date <= "${starts[starts.length - 1]}"`,
      fields: 'id,start_date,end_date,location,max_subscriptions',
    })
    const existingByKey = new Map(
      existing.map(record => [duplicateKey(record), record.id]),
    )

    const toCreate: typeof payloads = []
    for (const payload of payloads) {
      const key = duplicateKey(payload)
      const existingId = existingByKey.get(key)
      if (existingId) {
        result.duplicates.push(existingId)
        continue
      }
      // Also dedupe within the file itself
      existingByKey.set(key, 'pending')
      toCreate.push(payload)
    }

    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const batch = pb.createBatch()
      toCreate
        .slice(i, i + BATCH_SIZE)
        .forEach(payload => batch.collection('ut_events').create(payload))
      const responses = await batch.send()
      responses.forEach(response => result.inserted.push(response.body.id))
      submitProgress.value = Math.round(
        (Math.min(i + BATCH_SIZE, toCreate.length) / toCreate.length) * 100,
      )
    }

    importResult.value = result
    importMode.value = 'done'
    emit('imported')
  } catch {
    ElMessage.error('Erreur lors de la création des sessions')
  } finally {
    uploading.value = false
  }
}

const rowClass = ({ row }: { row: Record<string, any> }) => {
  if (!row.importable) {
    return 'row-error'
  }
  if (!row.import) {
    return 'row-disabled'
  }
  return ''
}

const close = () => {
  emit('update:modelValue', false)
}

watch(importMode, value => {
  if (value === 'upload') {
    events.value = []
  }
})

watch(
  () => props.modelValue,
  value => {
    open.value = value
    if (value) {
      importMode.value = 'upload'
      events.value = []
    }
  },
)
</script>

<style>
.el-table__row.row-disabled .cell {
  color: var(--el-text-color-disabled);
}
.el-table--striped .el-table__body .el-table__row.row-error .el-table__cell {
  background-color: var(--el-color-error-light-9);
}
</style>

<style scoped>
.error {
  color: var(--el-color-error);
}
</style>
