<template>
  <div class="ocm_manual_form">
    <h5 class="">
      {{
        t(
          "contacts",
          "Accept an invite from someone outside your organisation to collaborate."
        )
      }}
    </h5>
    <p>
      {{
        t(
          "contacts",
          "After you have accepted the invite, both of you will appear in each others' contacts list and you can start sharing data with each other."
        )
      }}
    </p>

    <div class="ocm_manual_inputs">
      <NcTextField
        v-model="invite"
        label="Invite"
        type="text"
        :error="Boolean(error)"
        :helper-text="error || 'Paste `token@provider` or the full invite string'"
      />

      <div class="ocm_manual_buttons">
        <Button @click="accept">
          <template #icon>
            <IconLoading v-if="loadingUpdate" :size="20" />
            <IconCheck v-else :size="20" />
          </template>
          {{ t("contacts", "Accept") }}
        </Button>
        <Button @click="cancel">
          <template #icon>
            <IconLoading v-if="loadingUpdate" :size="20" />
            <IconCancel v-else :size="20" />
          </template>
          {{ t("contacts", "Cancel") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
import NcTextField from "@nextcloud/vue/components/NcTextField";
import NcButton from "@nextcloud/vue/components/NcButton";

export default {
  name: "OcmAcceptForm",
  components: { NcTextField, NcButton },
  data() {
    return {
      invite: "",
      error: "",
    };
  },
  methods: {
    parseInvite(str) {
      const s = String(str || "").trim();
      const idx = s.lastIndexOf("@");
      if (idx === -1) {
        throw new Error("No @ found in invite");
      }
      const token = s.slice(0, idx);
      const provider = s.slice(idx + 1);
      if (!token || !provider) {
        throw new Error("Malformed invite");
      }
      return { provider, token };
    },

    accept() {
      this.error = "";
      try {
        const { provider, token } = this.parseInvite(this.invite);
        this.$emit("accept", { provider, token });
      } catch (e) {
        this.error = "Invalid invite format";
        this.$emit("parse-error", { message: this.error });
      }
    },

    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>
<style lang="scss" scoped>
.ocm_manual_buttons {
  display: flex;
  gap: 0.5rem;
}

.ocm_manual_form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1em;
  p {
    margin-bottom: 1em;
  }

  div.ocm_manual_inputs {
    margin-inline-start: 0.2em;
    width: 80%;
  }
}
</style>
