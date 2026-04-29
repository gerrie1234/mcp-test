/**
 * nodegoat API client
 *
 * Key model facts (project 1 — Correspondence Networks):
 *   Type 1  = Letter  │  field 161 = Sender (→ Person)
 *                     │  field 162 = Receiver (→ Person)
 *                     │  field 163 = Date
 *   Type 4  = Person  │  field   9 = Given Name
 *                     │  field  10 = Family Name
 *   Type 5  = City
 */

const DEFAULT_BASE = "https://demo.nodegoat.io";

export class NodegoatClient {
  constructor(opts = {}) {
    this.base    = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
    this.project = opts.projectId ?? 1;
    this.headers = { Accept: "application/json" };
    if (opts.apiKey) this.headers["Authorization"] = `Bearer ${opts.apiKey}`;
  }

  async #get(path, params = {}) {
    const url = new URL(`${this.base}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`nodegoat API error ${res.status} — ${url}`);
    return res.json();
  }

  getModel() {
    return this.#get(`/project/${this.project}/model/type`);
  }

  getObjects(typeId, filter) {
    const params = {};
    if (filter) params.filter = JSON.stringify(filter);
    return this.#get(`/project/${this.project}/data/type/${typeId}/object`, params);
  }

  getObject(typeId, objectId) {
    return this.#get(`/project/${this.project}/data/type/${typeId}/object/${objectId}`);
  }

  searchPersons(givenName, familyName) {
    const defs = {};
    if (givenName)  defs["9"]  = [{ equality: "*", value: givenName }];
    if (familyName) defs["10"] = [{ equality: "*", value: familyName }];
    return this.getObjects(4, {
      form: { f1: {
        type_id: 4, source: null,
        options: { operator: "object_or_sub_or", operator_extra: "1", exclude: "" },
        object_definitions: defs,
      }},
    });
  }

  getLettersBySender(personObjectId) {
    return this.getObjects(1, {
      form: { f1: {
        type_id: 1, source: null,
        options: { operator: "object_or_sub_or", operator_extra: "1", exclude: "" },
        object_definitions: { "161": [personObjectId] },
      }},
    });
  }

  getLettersByReceiver(personObjectId) {
    return this.getObjects(1, {
      form: { f1: {
        type_id: 1, source: null,
        options: { operator: "object_or_sub_or", operator_extra: "1", exclude: "" },
        object_definitions: { "162": [personObjectId] },
      }},
    });
  }

  getLettersBetween(senderObjectId, receiverObjectId) {
    return this.getObjects(1, {
      form: { f1: {
        type_id: 1, source: null,
        options: { operator: "object_or_sub_or", operator_extra: "1", exclude: "" },
        object_definitions: { "161": [senderObjectId], "162": [receiverObjectId] },
      }},
    });
  }
}
