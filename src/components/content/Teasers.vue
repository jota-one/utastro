<template>
  <div v-if="teasers.length" class="teasers">
    <ContentBlockSpace size="half" />
    <ContentBlockTitle v-if="title" :text="title" />
    <div class="container slim">
      <div class="wrapper">
        <AngledBoxesRow class="teasers-list" :boxes="teasers" scrollable>
          <template #box="{ item, index }">
            <div
              :class="[
                'teaser',
                {
                  first: index === 0,
                  last: index === teasers.length - 1,
                  hasImage: Boolean(item.imageUrl),
                },
              ]"
            >
              <img v-if="item.imageUrl" class="image" :src="item.imageUrl" />
              <TagList class="tags">
                <Tag
                  v-for="tag in item.tags"
                  :key="tag.id"
                  :label="tag.label"
                />
              </TagList>
              <div class="content">
                <h3 v-if="item.title" class="title">
                  <TextOnBg>{{ item.title }}</TextOnBg>
                </h3>
                <div
                  v-if="item.description"
                  class="description"
                  v-html="item.description.replace(/\n/gim, '<br>')"
                />
                <ArrowLink
                  v-if="item.link"
                  class="link"
                  :href="item.link.href"
                  :label="item.link.label"
                  as-button
                />
              </div>
            </div>
          </template>
        </AngledBoxesRow>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Teaser } from '@/types'
import AngledBoxesRow from '@components/AngledBoxesRow.vue'
import ContentBlockSpace from '@components/content/BlockSpace.vue'
import ContentBlockTitle from '@components/content/BlockTitle.vue'
import ArrowLink from '@/components/ArrowLink.vue'
import TagList from '@components/TagList.vue'
import Tag from '@components/Tag.vue'
import TextOnBg from '@components/TextOnBg.vue'

type Props = {
  teasers?: Teaser[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  teasers: () => [],
  title: undefined,
})
</script>

<style lang="postcss" scoped>
@import '@/assets/styles/_mediaquery.pcss';

.teasers-list {
  &:not(.single) {
    .teaser {
      &.first {
        padding-bottom: 2.5rem;

        @media (--m) {
          padding-bottom: 1.5rem;
          padding-right: 2.5rem;
        }
      }

      &:not(.first) {
        padding-top: 2.5rem;
        padding-bottom: 2.5rem;

        @media (--m) {
          padding-top: 1.5rem;
          padding-bottom: 1.5rem;
          padding-left: 2.5rem;

          &:not(.last) {
            padding-right: 2.5rem;
          }
        }

        &.last {
          padding-bottom: 1.5rem;
        }
      }
    }
  }
}

.teaser {
  position: relative;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
  background-color: rgb(var(--color-neutral-lightest));
  overflow: hidden;

  &:hover .image {
    transform: scale(1.15);
  }
}

.image {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 0;
  object-fit: cover;
  transition: transform 0.1s ease-in-out;
}

.tags {
  padding-bottom: 0.5rem;
}

.content {
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.title,
.description {
  margin-left: 0.25rem;
}

.title {
  padding-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 700;

  .hasImage & {
    padding-bottom: 0.75rem;
  }
}

.description {
  .hasImage & {
    color: rgb(var(--color-white));
    font-weight: 700;
    text-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  }
}

.link {
  position: relative;
  align-self: flex-start;
  margin-top: 1.25rem;
  padding: 0.6rem;
}
</style>
