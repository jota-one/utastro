<template>
  <div class="container superslim">
    <div v-if="person" class="address">
      <h3 class="name">{{ person.firstName }} {{ person.lastName }}</h3>
      <em v-if="person.title" class="title">{{ person.title }}</em>
      <div class="street">{{ person.street }}</div>
      <div class="city">{{ person.zip }} {{ person.city }}</div>
      <div v-if="person.phone" class="phone">{{ person.phone }}</div>
      <div class="email">
        <a href="`mailto:${person.email}`">{{ person.email }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Person {
  firstName: string
  lastName: string
  title?: string
  street: string
  zip: number | string
  city: string
  phone?: string
  email: string
}

defineProps<{ person?: Person }>()
</script>

<style lang="postcss" scoped>
.address {
  font-size: 1rem;
}

.name {
  font-size: 1.4rem;
  font-weight: 700;
}

.email {
  margin-top: 1rem;
  font-weight: 600;
}
</style>
