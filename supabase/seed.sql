CREATE OR REPLACE FUNCTION reorder_lists(board_id BIGINT, list_id BIGINT, current_index INT, new_index INT)
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

CREATE OR REPLACE FUNCTION reorder_cards(card_id BIGINT, current_list_id BIGINT, new_list_id BIGINT, current_index INT, new_index INT)
RETURNS VOID
LANGUAGE PLPGSQL
AS $$
  DECLARE
      card_index INT;
  BEGIN
      SELECT index INTO card_index FROM card WHERE "listId" = current_list_id AND id = card_id AND "deletedAt" IS NULL;
      
      IF current_list_id = new_list_id THEN
          UPDATE card
          SET index =
              CASE
                  WHEN index = current_index THEN new_index
                  WHEN current_index < new_index AND index > current_index AND index <= new_index THEN index - 1
                  WHEN current_index > new_index AND index >= new_index AND index < current_index THEN index + 1
                  ELSE index
              END
          WHERE "listId" = current_list_id AND "deletedAt" IS NULL;
      ELSE
          UPDATE card
          SET index = index + 1
          WHERE "listId" = new_list_id AND index >= new_index AND "deletedAt" IS NULL;

          UPDATE card
          SET index = index - 1
          WHERE "listId" = current_list_id AND index >= current_index AND "deletedAt" IS NULL;

          UPDATE card
          SET "listId" = new_list_id, index = new_index
          WHERE id = card_id AND "deletedAt" IS NULL;
      END IF;
  END;
$$

CREATE OR REPLACE FUNCTION shift_list_index(board_id BIGINT, list_index INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE list
    SET index = index - 1
    WHERE "boardId" = board_id AND index > list_index AND "deletedAt" IS NULL;
$$;

CREATE OR REPLACE FUNCTION shift_card_index(list_id BIGINT, card_index INT)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE card
    SET index = index - 1
    WHERE "listId" = list_id AND index > card_index AND "deletedAt" IS NULL;
$$;

