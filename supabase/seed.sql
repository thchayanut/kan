CREATE OR REPLACE FUNCTION reorder_list(board_id BIGINT, list_id BIGINT, current_index INT, new_index INT)
RETURNS VOID
LANGUAGE SQL
AS $$  
  UPDATE list
    SET index =
      CASE
        WHEN index = current_index AND id = list_id THEN new_index
        WHEN current_index < new_index AND index > current_index AND index <= new_index THEN index - 1
        WHEN current_index > new_index AND index >= new_index AND index < current_index THEN index + 1
        ELSE index
      END
    WHERE "boardId" = board_id;
$$;

CREATE OR REPLACE FUNCTION shift_list_index(board_id BIGINT, list_index INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE list
    SET index = index - 1
    WHERE "boardId" = board_id AND index > list_index AND "deletedAt" IS NULL;
$$;