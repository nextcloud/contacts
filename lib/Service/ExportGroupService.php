<?php

namespace OCA\Contacts\Service;

use OCP\AppFramework\Http\DataDownloadResponse;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

class ExportGroupService {

	private $db;

	public function __construct(IDBConnection $db) {
		$this->db = $db;
	}

	private function getCardIds($group) {
		// query database
		$qb = $this->db->getQueryBuilder();
		$qb->select('cardid')
			->from('cards_properties')
			->where(
				$qb->expr()->andX(
					$qb->expr()->eq('name',
						$qb->createNamedParameter('CATEGORIES', IQueryBuilder::PARAM_STR)),
					$qb->expr()->like('value',
						$qb->createNamedParameter('%' . $group . '%', IQueryBuilder::PARAM_STR))
				)
			);
		$cursor = $qb->execute();
		$rows = $cursor->fetchAll();
		$cursor->closeCursor();
		// construct result
		$result = [];
		foreach ($rows as $key => $value) {
			array_push($result, $value['cardid']);
		}
		// return result
		return $result;
	}

	private function getCards($cardIds) {
		// query database
		$qb = $this->db->getQueryBuilder();
		$qb->select('carddata')
			->from('cards')
			->where(
				$qb->expr()->in('id',
					$qb->createNamedParameter($cardIds, IQueryBuilder::PARAM_INT_ARRAY))
			);
		$cursor = $qb->execute();
		$rows = $cursor->fetchAll();
		$cursor->closeCursor();
		// construct result
		$result = [];
		foreach ($rows as $key => $value) {
			array_push($result, $value['carddata']);
		}
		// return result
		return $result;

	}

	public function exportGroup($group): DataDownloadResponse {
		// get cards
		$cardIds = $this->getCardIds($group);
		$cards = $this->getCards($cardIds);
		// construct result
		$result = '';
		foreach ($cards as $key => $value) {
			$result .= $value;
		}
		// return result
		return new DataDownloadResponse(
			$result,
			$group . '.vcf',
			'text/x-vcard;charset=utf-8;'
		);
	}

}
