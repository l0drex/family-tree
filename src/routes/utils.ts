import { Base } from "gedcomx-js";
import { Table } from "dexie";
import { redirect } from "react-router-dom";
import { strings } from "../main";

export function getAll<T>(table: Table<T>, Constructor: any): () => Promise<T[]> {
  return async () => table.toArray().then(data =>
    data.length
      ? data.map(d => new Constructor(d))
      : Promise.reject(new Error(strings.errors.noData)));
}

/**
 * Sets the values of the given object to the values of the given form data.
 * @param formData where keys match the keys in the data object (not all have to be present)
 * @param data to be updated
 */
export function updateObject(formData: FormData, data: object = {}): object {
  formData.forEach((value, key) => {
    if (key === "attribution") {
      value = JSON.parse(value as string);
    } else if (key === "changeMessage") {
      data["attribution"] ??= {};
      data["attribution"]["changeMessage"] = value;
      return;
    } else if (key.endsWith(".resource")) {
      data[key.split(".")[0]] = { resource: value };
      return;
    }

    data[key] = value;
  });

  return data;
}

/**
 * Pushes the given value to the given array and updates the database.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param array value behind key
 * @param newValue value to be added to the array
 *
 * @example table.get(id)[key].push(newValue);
 */
export async function pushArray<T extends Base>(table: Table, id: string, key: string, array: T[], newValue: T) {
  array ??= [];

  array.push(newValue);
  await updateDB(table, id, key, array);
  return redirect("../");
}

/**
 * Updates the given value in the given array and updates the database.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param array value behind key
 * @param index index of newValue in the array
 * @param newValue updated value
 *
 * @example table.get(id)[key][index] = newValue;
 */
export async function updateArray<T extends Base>(table: Table, id: string, key: string, array: T[], index: number, newValue?: T) {
  if (newValue != null) {
    array[index] = newValue;
  } else {
    array.splice(index, 1);
    if (array.length === 0) {
      array = null;
    }
  }

  await updateDB(table, id, key, array);
  return redirect("../../")
}

/**
 * Updates key of instance id with value in the table.
 * @param table database table
 * @param id primary index of the value in the database table
 * @param key property of the database instance to be updated
 * @param newValue updated value
 */
export async function updateDB(table: Table, id: string, key: string, newValue: any[] | any): Promise<number> {
  let changes = {};

  if (newValue instanceof Array)
    changes[key] = newValue?.map(d => d.toJSON());
  else
    changes[key] = newValue?.toJSON();

  return table.update(id, changes)
}
