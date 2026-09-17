<template>
  <div v-if="totalPages > 0" class="pagination">
    <!-- 처음으로 -->
    <button
      :disabled="page <= 1"
      @click="$emit('change', 1)"
      title="처음 페이지"
    >
      «
    </button>

    <!-- 이전 페이지 -->
    <button :disabled="page <= 1" @click="$emit('change', page - 1)">‹</button>

    <!-- 페이지 번호 (최대 10개) -->
    <button
      v-for="p in pages"
      :key="p"
      :class="{ active: p === page }"
      @click="$emit('change', p)"
    >
      {{ p }}
    </button>

    <!-- 다음 페이지 -->
    <button :disabled="page >= totalPages" @click="$emit('change', page + 1)">
      ›
    </button>

    <!-- 끝으로 -->
    <button
      :disabled="page >= totalPages"
      @click="$emit('change', totalPages)"
      title="마지막 페이지"
    >
      »
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
});

defineEmits(["change"]);

// 최대 10개 페이지 번호를 블록 단위로 표시
const pages = computed(() => {
  const blockSize = 10;
  const start = Math.floor((props.page - 1) / blockSize) * blockSize + 1;
  const end = Math.min(props.totalPages, start + blockSize - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.pagination button {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  color: #475569;
  font-size: 0.9em;
  cursor: pointer;
}

.pagination button:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.pagination button.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  font-weight: bold;
}

.pagination button:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
  background: #f8fafc;
}
</style>
